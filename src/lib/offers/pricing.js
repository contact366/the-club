/**
 * src/lib/offers/pricing.js
 *
 * Calcul serveur des prix et économies à partir de public.offers.
 *
 * Le client ne reçoit JAMAIS le calcul brut : savedAmount est toujours
 * déterminé ici, côté serveur, à partir des colonnes xxx_benefit_* de l'offre.
 *
 * Types de bénéfice supportés :
 *   percentage     → savedAmount = amount * (value / 100)
 *   fixed_discount → savedAmount = value (montant fixe déduit)
 *   fixed_price    → savedAmount = amount - value  (prix final fixe)
 *   free           → savedAmount = amount (tout est offert)
 *   custom         → savedAmount = 0, benefitLabel seul fait foi
 */

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule les montants à partir d'un bénéfice.
 *
 * @param {number} originalAmount
 * @param {string} benefitType
 * @param {number} benefitValue
 * @returns {{ savedAmount: number, finalAmount: number }}
 */
function computeBenefit(originalAmount, benefitType, benefitValue) {
  const amount = parseFloat(originalAmount) || 0;
  const value = parseFloat(benefitValue) || 0;

  switch (benefitType) {
    case 'percentage': {
      const saved = round2(amount * (value / 100));
      return { savedAmount: saved, finalAmount: round2(amount - saved) };
    }
    case 'fixed_discount': {
      const saved = Math.min(value, amount); // ne peut pas dépasser le montant
      return { savedAmount: round2(saved), finalAmount: round2(amount - saved) };
    }
    case 'fixed_price': {
      const finalAmount = Math.min(value, amount);
      return { savedAmount: round2(amount - finalAmount), finalAmount: round2(finalAmount) };
    }
    case 'free': {
      return { savedAmount: round2(amount), finalAmount: 0 };
    }
    case 'custom':
    default: {
      // Bénéfice non calculable côté serveur : économie = 0
      return { savedAmount: 0, finalAmount: round2(amount) };
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Point d'entrée principal
// ─────────────────────────────────────────────────────────────

/**
 * Calcule le prix final et l'économie réalisée pour un plan donné.
 *
 * @param {object} offer      - Ligne complète de public.offers
 * @param {string} plan       - Plan normalisé ('aventurier'|'explorer'|'celeste')
 * @param {number} amount     - Montant original de la facture (fourni par le client,
 *                              validé avant cet appel)
 * @returns {{
 *   originalAmount: number,
 *   savedAmount: number,
 *   finalAmount: number,
 *   benefitType: string,
 *   benefitLabel: string,
 * }}
 *
 * @throws {Error} si le plan n'est pas reconnu ou si l'offre ne définit pas
 *                 de bénéfice pour ce plan.
 */
export function computeOfferPricing(offer, plan, amount) {
  let benefitType;
  let benefitValue;
  let benefitLabel;

  if (plan === 'aventurier') {
    benefitType = offer.aventurier_benefit_type;
    benefitValue = offer.aventurier_benefit_value;
    benefitLabel = offer.aventurier_benefit_label;
  } else if (plan === 'explorer') {
    benefitType = offer.explorer_benefit_type;
    benefitValue = offer.explorer_benefit_value;
    benefitLabel = offer.explorer_benefit_label;
  } else if (plan === 'celeste') {
    benefitType = offer.celeste_benefit_type;
    benefitValue = offer.celeste_benefit_value;
    benefitLabel = offer.celeste_benefit_label;
  } else {
    throw new Error(`Plan inconnu : ${plan}`);
  }

  if (!benefitType) {
    throw new Error(`Aucun bénéfice défini pour le plan ${plan} sur l'offre ${offer.id}`);
  }

  const { savedAmount, finalAmount } = computeBenefit(amount, benefitType, benefitValue);

  return {
    originalAmount: round2(parseFloat(amount) || 0),
    savedAmount,
    finalAmount,
    benefitType,
    benefitLabel: benefitLabel || '',
  };
}
