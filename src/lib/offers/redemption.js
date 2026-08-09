/**
 * src/lib/offers/redemption.js
 *
 * Orchestrateur principal du moteur d'offres The Club.
 *
 * Processus complet (côté serveur uniquement) :
 *   1. Récupérer le profil authentifié
 *   2. Récupérer l'offre depuis public.offers
 *   3. Vérifier validité, accès plan, limites Discovery
 *   4. Vérifier le PIN côté serveur
 *   5. Calculer prix / économie
 *   6. Écrire dans public.offer_usage (nouveau système)
 *   7. Écrire dans public.utilisations (compatibilité)
 *   8. Mettre à jour profiles.montant_economise
 *
 * ⚠️  HYPOTHÈSES SUR public.offers :
 *   - Colonne `id`             : UUID primaire
 *   - Colonne `partner_id`     : UUID → FK vers partners
 *   - Colonne `is_active`      : boolean
 *   - Colonne `valid_from`     : date (nullable)
 *   - Colonne `valid_until`    : date (nullable)
 *   - Colonne `access_level`   : text (standard|premium|exclusive_explorer|exclusive_celeste)
 *   - Colonne `offer_category` : text (discovery|permanent|premium|…) – utilisé pour détecter
 *                                les Discovery ; si absent, fallback sur `offer_type`
 *   - Colonnes bénéfice par plan : aventurier_enabled, aventurier_benefit_type,
 *                                  aventurier_benefit_value, aventurier_benefit_label, etc.
 *
 * ⚠️  HYPOTHÈSES SUR public.offer_usage :
 *   - Colonnes existantes + offer_uuid (UUID nullable → FK vers offers)
 *   - Colonnes utilisées ici : user_id, offer_uuid, offer_type, used_at
 *
 * ⚠️  HYPOTHÈSES SUR public.utilisations (compatibilité) :
 *   - user_id, establishment_id, offer_type, original_amount, saved_amount
 *   - partner_id (optionnel, via index existant)
 *
 * Si les colonnes réelles diffèrent, ajuster les noms ici sans toucher au reste.
 */

import { createClient } from '@supabase/supabase-js';
import { normalizePlan, checkAccess } from './access.js';
import { computeOfferPricing } from './pricing.js';

// ─────────────────────────────────────────────────────────────
// Client admin (service role — lecture/écriture sans RLS)
// ─────────────────────────────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────

/**
 * Détermine si une offre est de type Discovery.
 */
function isDiscoveryOffer(offer) {
  return offer.offer_type === 'discovery';
}

/**
 * Récupère le nombre de Discovery utilisées par l'utilisateur ce mois-ci
 * depuis la table `utilisations` (existante).
 */
async function getMonthlyDiscoveryCount(supabase, userId) {
  const debutDuMois = new Date();
  debutDuMois.setDate(1);
  debutDuMois.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('utilisations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('offer_type', 'decouverte')
    .gte('created_at', debutDuMois.toISOString());

  return count ?? 0;
}

/**
 * Récupère les utilisations Discovery de cet établissement sur l'année-membre.
 * Retourne un tableau de lignes (au minimum { created_at }).
 */
async function getYearlyDiscoveryUsages(supabase, userId, establishmentId, memberCreatedAt) {
  // Période annuelle basée sur la date d'inscription
  let yearStart = null;
  if (memberCreatedAt) {
    const { getMemberYearStart } = await import('./access.js');
    yearStart = getMemberYearStart(memberCreatedAt);
  }

  const query = supabase
    .from('utilisations')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('establishment_id', establishmentId)
    .eq('offer_type', 'decouverte');

  if (yearStart) {
    query.gte('created_at', yearStart.toISOString());
  }

  const { data } = await query;
  return data || [];
}

// ─────────────────────────────────────────────────────────────
// Point d'entrée principal
// ─────────────────────────────────────────────────────────────

/**
 * Consomme une offre pour un utilisateur authentifié.
 *
 * @param {object} params
 * @param {string} params.userId          - ID Supabase de l'utilisateur (auth.uid)
 * @param {string} params.offerId         - UUID de l'offre dans public.offers
 * @param {string} params.establishmentId - UUID de l'établissement (partners.id)
 * @param {number} params.amount          - Montant brut de la facture
 * @param {string} params.pin             - Code PIN saisi par le commerçant
 *
 * @returns {Promise<{
 *   success: true,
 *   offerId: string,
 *   offerType: string,
 *   originalAmount: number,
 *   savedAmount: number,
 *   finalAmount: number,
 *   benefitLabel: string,
 * }>}
 *
 * @throws {Error} avec un code `reason` en cas d'échec métier,
 *                 ou message d'erreur en cas d'erreur technique.
 */
export async function redeemOffer({ userId, offerId, establishmentId, amount, pin }) {
  const supabase = getAdminClient();

  // ── 1. Récupérer le profil ──────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_type, montant_economise, subscription_started_at, created_at')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw Object.assign(new Error('Profil introuvable'), { reason: 'PROFILE_NOT_FOUND' });
  }

  // ── 2. Récupérer l'offre ────────────────────────────────────
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    throw Object.assign(new Error('Offre introuvable'), { reason: 'OFFER_NOT_FOUND' });
  }

  // ── 3. Vérifier l'établissement / partenaire ─────────────────
  if (!offer.partner_id) {
    const err = new Error("Cette offre n'est associée à aucun partenaire.");
    err.reason = 'OFFER_PARTNER_MISSING';
    err.statusCode = 400;
    throw err;
  }
  if (offer.partner_id !== establishmentId) {
    const err = new Error("L'établissement ne correspond pas à cette offre.");
    err.reason = 'PARTNER_MISMATCH';
    err.statusCode = 403;
    throw err;
  }

  // ── 4. Déterminer le type d'offre ───────────────────────────
  const discoveryOffer = isDiscoveryOffer(offer);
  const plan = normalizePlan(profile.subscription_type);

  // Date de référence pour la période annuelle Discovery.
  // subscription_started_at est obligatoire : si absent, on refuse explicitement
  // plutôt que de silencieusement utiliser created_at.
  const memberStartDate = profile.subscription_started_at || null;

  if (discoveryOffer && !memberStartDate) {
    const err = new Error('Date de début d\'abonnement manquante — contactez le support.');
    err.reason = 'SUBSCRIPTION_START_DATE_MISSING';
    err.statusCode = 422;
    throw err;
  }

  // ── 5. Récupérer les données Discovery si nécessaire ─────────
  let yearlyUsages = [];
  let monthlyDiscoveryCount = 0;

  if (discoveryOffer) {
    [yearlyUsages, monthlyDiscoveryCount] = await Promise.all([
      getYearlyDiscoveryUsages(supabase, userId, establishmentId, memberStartDate),
      getMonthlyDiscoveryCount(supabase, userId),
    ]);
  }

  // ── 6. Vérifier l'accès complet ─────────────────────────────
  const accessResult = checkAccess({
    offer,
    plan: profile.subscription_type,
    memberCreatedAt: memberStartDate,
    isDiscovery: discoveryOffer,
    yearlyUsages,
    monthlyDiscoveryCount,
  });

  if (!accessResult.allowed) {
    const err = new Error(`Accès refusé : ${accessResult.reason}`);
    err.reason = accessResult.reason;
    err.statusCode = 403;
    throw err;
  }

  // ── 7. Vérifier le PIN ──────────────────────────────────────
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('pin_code')
    .eq('id', establishmentId)
    .single();

  if (partnerError || !partner) {
    throw Object.assign(new Error('Partenaire introuvable'), { reason: 'PARTNER_NOT_FOUND' });
  }

  if (!pin || pin !== partner.pin_code) {
    const err = new Error('Code PIN incorrect');
    err.reason = 'WRONG_PIN';
    err.statusCode = 401;
    throw err;
  }

  // ── 8. Calculer le prix ─────────────────────────────────────
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw Object.assign(new Error('Montant invalide'), { reason: 'INVALID_AMOUNT', statusCode: 400 });
  }

  const pricing = computeOfferPricing(offer, plan, parsedAmount);

  // ── 9. Déterminer offer_type pour les logs ───────────────────
  const offerTypeLegacy = discoveryOffer ? 'decouverte' : 'permanente';

  // ── 10. Enregistrer dans offer_usage (nouveau) ──────────────
  const usedAt = new Date().toISOString();
  const { error: usageError } = await supabase.from('offer_usage').insert({
    user_id: userId,
    offer_uuid: offerId,
    offer_type: offerTypeLegacy,
    used_at: usedAt,
  });

  if (usageError) {
    console.error('[offers/redemption] Erreur offer_usage insert:', usageError.message);
    throw Object.assign(new Error('Erreur enregistrement offer_usage'), {
      reason: 'OFFER_USAGE_SAVE_FAILED',
      statusCode: 500,
    });
  }

  // ── 11. Enregistrer dans utilisations (compatibilité) ───────
  const { error: utilisationsError } = await supabase.from('utilisations').insert({
    user_id: userId,
    establishment_id: establishmentId,
    offer_type: offerTypeLegacy,
    original_amount: pricing.originalAmount,
    saved_amount: pricing.savedAmount,
  });

  if (utilisationsError) {
    // Si doublon (contrainte unique), c'est une double-soumission
    if (utilisationsError.code === '23505') {
      const err = new Error('Offre déjà utilisée');
      err.reason = discoveryOffer ? 'ANNUAL_DISCOVERY_LIMIT' : 'ALREADY_USED';
      err.statusCode = 409;
      throw err;
    }
    console.error('[offers/redemption] Erreur utilisations insert:', utilisationsError.message);
    throw Object.assign(new Error('Erreur enregistrement'), { reason: 'DB_ERROR', statusCode: 500 });
  }

  // ── 12. Mettre à jour montant_economise ──────────────────────
  const currentSavings = parseFloat(profile.montant_economise || 0);
  const newTotal = Math.round((currentSavings + pricing.savedAmount) * 100) / 100;

  await supabase
    .from('profiles')
    .update({ montant_economise: newTotal })
    .eq('id', userId);

  // ── 13. Retourner le résultat ────────────────────────────────
  return {
    success: true,
    offerId,
    offerType: offerTypeLegacy,
    originalAmount: pricing.originalAmount,
    savedAmount: pricing.savedAmount,
    finalAmount: pricing.finalAmount,
    benefitLabel: pricing.benefitLabel,
  };
}
