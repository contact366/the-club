/**
 * src/lib/offers/access.js
 *
 * Moteur de contrôle d'accès aux offres The Club.
 *
 * Vérifie si un membre (par son subscription_type) peut utiliser
 * une offre donnée (par son access_level et ses flags plan-specific).
 *
 * Retourne soit { allowed: true } soit { allowed: false, reason: 'CODE' }.
 *
 * Codes de refus :
 *   CELESTE_ONLY            – offre réservée aux membres Céleste
 *   PREMIUM_ONLY            – offre réservée aux abonnés avec accès Premium
 *   EXCLUSIVE_EXPLORER_ONLY – offre Exclusive Explorer, accès Aventurier refusé
 *   OFFER_DISABLED          – offre inactive pour ce plan (flag xxx_enabled = false)
 *   OFFER_EXPIRED           – offre hors période de validité
 *   OFFER_INACTIVE          – offre désactivée globalement (is_active = false)
 *   DISCOVERY_NOT_AVAILABLE – plan Aventurier ne dispose pas des Discovery
 *   MONTHLY_DISCOVERY_LIMIT – Explorer a atteint sa limite mensuelle de 4 Discovery
 *   ANNUAL_DISCOVERY_LIMIT  – cette offre Discovery a déjà été utilisée cette année-membre
 *   NO_SUBSCRIPTION         – l'utilisateur n'a pas d'abonnement actif
 *
 * IMPORTANT : Ne modifie pas la base de données. Lecture seule.
 */

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Normalise un subscription_type en plan interne ('aventurier'|'explorer'|'celeste'|'none').
 */
export function normalizePlan(rawPlan) {
  if (!rawPlan) return 'none';
  const p = rawPlan.toLowerCase().trim();
  if (p.includes('aventurier')) return 'aventurier';
  if (p.includes('celeste') || p.includes('céleste')) return 'celeste';
  if (p.includes('explorer') || p.includes('cercle')) return 'explorer';
  return 'none';
}

/**
 * Calcule le début de la période annuelle du membre à partir de sa date de début.
 *
 * La date de début est calculée depuis `profiles.created_at` (date d'inscription),
 * qui est la meilleure approximation disponible du début d'appartenance.
 *
 * IMPORTANT : Si `memberCreatedAt` est null/undefined, cette fonction retourne null
 * et le contrôleur doit refuser la Discovery avec ANNUAL_DISCOVERY_LIMIT par sécurité.
 *
 * @param {string|Date} memberCreatedAt - Date d'inscription (profiles.created_at)
 * @returns {Date|null}
 */
export function getMemberYearStart(memberCreatedAt) {
  if (!memberCreatedAt) return null;

  const start = new Date(memberCreatedAt);
  if (isNaN(start.getTime())) return null;

  const now = new Date();

  // Avancer la date anniversaire jusqu'à ce qu'elle soit dans le passé
  const yearStart = new Date(start);
  while (yearStart <= now) {
    yearStart.setFullYear(yearStart.getFullYear() + 1);
  }
  // Reculer d'un an pour obtenir le début de l'année en cours
  yearStart.setFullYear(yearStart.getFullYear() - 1);
  return yearStart;
}

// ─────────────────────────────────────────────────────────────
// Vérifications de base
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie qu'une offre est globalement active et dans ses dates de validité.
 */
export function checkOfferValidity(offer) {
  if (!offer.is_active) {
    return { allowed: false, reason: 'OFFER_INACTIVE' };
  }

  const now = new Date();
  if (offer.valid_from && new Date(offer.valid_from) > now) {
    return { allowed: false, reason: 'OFFER_EXPIRED' };
  }
  if (offer.valid_until && new Date(offer.valid_until) < now) {
    return { allowed: false, reason: 'OFFER_EXPIRED' };
  }

  return { allowed: true };
}

/**
 * Vérifie l'accès au niveau du plan (access_level + flags par plan).
 *
 * Règles :
 *   standard         → selon le flag xxx_enabled du plan
 *   premium          → Aventurier refusé ; Explorer/Céleste autorisé
 *   exclusive_explorer → Aventurier refusé ; Explorer/Céleste autorisé
 *   exclusive_celeste  → Aventurier refusé ; Explorer refusé ; Céleste seul
 */
export function checkPlanAccess(offer, plan) {
  if (plan === 'none') {
    return { allowed: false, reason: 'NO_SUBSCRIPTION' };
  }

  const level = offer.access_level || 'standard';

  // ── Vérifications par access_level ──────────────────────────
  if (level === 'exclusive_celeste') {
    if (plan !== 'celeste') {
      return { allowed: false, reason: 'CELESTE_ONLY' };
    }
  } else if (level === 'exclusive_explorer') {
    if (plan === 'aventurier') {
      return { allowed: false, reason: 'EXCLUSIVE_EXPLORER_ONLY' };
    }
  } else if (level === 'premium') {
    if (plan === 'aventurier') {
      return { allowed: false, reason: 'PREMIUM_ONLY' };
    }
  }
  // level === 'standard' → pas de restriction par access_level

  // ── Vérifications par flag plan ──────────────────────────────
  if (plan === 'aventurier' && !offer.aventurier_enabled) {
    return { allowed: false, reason: 'OFFER_DISABLED' };
  }
  if (plan === 'explorer' && !offer.explorer_enabled) {
    return { allowed: false, reason: 'OFFER_DISABLED' };
  }
  if (plan === 'celeste' && !offer.celeste_enabled) {
    return { allowed: false, reason: 'OFFER_DISABLED' };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Vérifications Discovery
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie les règles Discovery spécifiques.
 *
 * @param {object} offer            - Ligne de public.offers
 * @param {string} plan             - Plan normalisé
 * @param {string|null} memberCreatedAt - profiles.created_at
 * @param {object[]} usages         - Lignes de utilisations (offer_type='decouverte')
 *                                    de l'utilisateur pour cet établissement
 * @param {number}  monthlyCount    - Nombre de Discovery utilisées ce mois-ci (Explorer)
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkDiscoveryLimits(offer, plan, memberCreatedAt, usages, monthlyCount) {
  // Aventurier n'a pas accès aux Discovery
  if (plan === 'aventurier') {
    return { allowed: false, reason: 'DISCOVERY_NOT_AVAILABLE' };
  }

  // Explorer : limite de 4 Discovery par mois
  if (plan === 'explorer' && monthlyCount >= 4) {
    return { allowed: false, reason: 'MONTHLY_DISCOVERY_LIMIT' };
  }

  // Limite annuelle : une même Discovery par an (période membre)
  const yearStart = getMemberYearStart(memberCreatedAt);
  if (!yearStart) {
    // Date de membre indisponible → refus par sécurité
    console.warn('[offers/access] memberCreatedAt indisponible — Discovery refusée par sécurité');
    return { allowed: false, reason: 'ANNUAL_DISCOVERY_LIMIT' };
  }

  const usedThisYear = (usages || []).some(
    (u) => new Date(u.created_at || u.used_at) >= yearStart
  );
  if (usedThisYear) {
    return { allowed: false, reason: 'ANNUAL_DISCOVERY_LIMIT' };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Point d'entrée principal
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie toutes les règles d'accès pour un membre donné sur une offre donnée.
 *
 * @param {object} params
 * @param {object} params.offer           - Ligne complète de public.offers
 * @param {string} params.plan            - subscription_type brut du profil
 * @param {string|null} params.memberCreatedAt - profiles.created_at
 * @param {boolean} params.isDiscovery    - true si offer.offer_category === 'discovery'
 * @param {object[]} params.yearlyUsages  - utilisations Discovery de cet établissement (cette année)
 * @param {number} params.monthlyDiscoveryCount - Discovery utilisées ce mois (Explorer)
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkAccess({
  offer,
  plan: rawPlan,
  memberCreatedAt,
  isDiscovery,
  yearlyUsages = [],
  monthlyDiscoveryCount = 0,
}) {
  const plan = normalizePlan(rawPlan);

  // 1. Validité globale de l'offre
  const validityCheck = checkOfferValidity(offer);
  if (!validityCheck.allowed) return validityCheck;

  // 2. Accès par plan
  const planCheck = checkPlanAccess(offer, plan);
  if (!planCheck.allowed) return planCheck;

  // 3. Règles Discovery (si applicable)
  if (isDiscovery) {
    const discoveryCheck = checkDiscoveryLimits(
      offer,
      plan,
      memberCreatedAt,
      yearlyUsages,
      monthlyDiscoveryCount
    );
    if (!discoveryCheck.allowed) return discoveryCheck;
  }

  return { allowed: true };
}
