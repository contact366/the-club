/**
 * POST /api/offers/redeem
 *
 * Point d'entrée API sécurisé pour consommer une offre The Club.
 *
 * Body attendu :
 * {
 *   offerId         : string  (UUID de l'offre dans public.offers)
 *   establishmentId : string  (UUID du partenaire)
 *   amount          : number  (montant brut de la facture)
 *   pin             : string  (code PIN saisi par le commerçant)
 * }
 *
 * Données JAMAIS acceptées depuis le client :
 *   savedAmount, discount, subscriptionType, partnerId, benefitType
 *
 * Réponse succès :
 * {
 *   success: true,
 *   offerId, offerType,
 *   originalAmount, savedAmount, finalAmount, benefitLabel
 * }
 *
 * Réponse erreur :
 * { error: string, reason?: string }
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { redeemOffer } from '@/lib/offers/redemption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Messages d'erreur localisés pour les codes de refus métier */
const REASON_MESSAGES = {
  CELESTE_ONLY: 'Cette offre est réservée aux membres Céleste.',
  PREMIUM_ONLY: 'Cette offre nécessite un accès Premium (Explorer ou Céleste).',
  EXCLUSIVE_EXPLORER_ONLY: 'Cette offre exclusive est réservée aux membres Explorer et Céleste.',
  OFFER_DISABLED: "Cette offre n'est pas disponible pour votre plan.",
  OFFER_EXPIRED: "Cette offre n'est plus valide.",
  OFFER_INACTIVE: "Cette offre est temporairement désactivée.",
  DISCOVERY_NOT_AVAILABLE: "Les offres Découverte ne sont pas incluses dans le Pass Aventurier.",
  MONTHLY_DISCOVERY_LIMIT: "Vous avez atteint votre limite de 4 offres Découverte ce mois-ci. Passez au Pass Céleste pour l'illimité !",
  ANNUAL_DISCOVERY_LIMIT: "Vous avez déjà utilisé l'offre Découverte de cet établissement cette année.",
  NO_SUBSCRIPTION: "Vous n'avez pas d'abonnement actif.",
  WRONG_PIN: "Code PIN incorrect.",
  ESTABLISHMENT_MISMATCH: "L'établissement ne correspond pas à cette offre.",
  INVALID_AMOUNT: "Montant de facture invalide.",
};

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    // ── 1. Authentifier l'utilisateur ───────────────────────
    // On utilise le client anon avec le cookie de session pour vérifier
    // l'identité sans exposer le service role key au client.
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Cookie: req.headers.get('cookie') || '' },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.', reason: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // ── 2. Lire et valider le body ──────────────────────────
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide.' }, { status: 400 });
    }

    const { offerId, establishmentId, amount, pin } = body;

    if (!offerId || typeof offerId !== 'string') {
      return NextResponse.json({ error: 'offerId manquant ou invalide.' }, { status: 400 });
    }
    if (!establishmentId || typeof establishmentId !== 'string') {
      return NextResponse.json({ error: 'establishmentId manquant ou invalide.' }, { status: 400 });
    }
    if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'amount manquant ou invalide.' }, { status: 400 });
    }
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'pin manquant.' }, { status: 400 });
    }

    // ── 3. Appeler le moteur de consommation ───────────────
    const result = await redeemOffer({
      userId: user.id,
      offerId,
      establishmentId,
      amount: parseFloat(amount),
      pin,
    });

    // ── 4. Déclencher la validation des badges (non bloquant) ──
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('category')
        .eq('id', establishmentId)
        .single();

      await fetch(`${req.headers.get('origin') || ''}/api/badges/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          establishmentId,
          partnerCategory: partner?.category || '',
        }),
      });
    } catch (badgeErr) {
      console.error('[offers/redeem] Erreur badges (non bloquant):', badgeErr.message);
    }

    return NextResponse.json(result);

  } catch (err) {
    const reason = err.reason;
    const statusCode = err.statusCode || 500;
    const friendlyMessage = REASON_MESSAGES[reason] || err.message || 'Erreur interne du serveur.';

    if (statusCode >= 500) {
      console.error('[offers/redeem] Erreur interne:', err.message);
    }

    return NextResponse.json(
      { error: friendlyMessage, reason: reason || 'INTERNAL_ERROR' },
      { status: statusCode }
    );
  }
}
