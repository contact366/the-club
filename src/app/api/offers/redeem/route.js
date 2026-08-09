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
  OFFER_PARTNER_MISSING: "Cette offre n'est associée à aucun partenaire.",
  PARTNER_MISMATCH: "L'établissement ne correspond pas à cette offre.",
  INVALID_AMOUNT: "Montant de facture invalide.",
  SUBSCRIPTION_START_DATE_MISSING: "Date de début d'abonnement manquante — contactez le support.",
  OFFER_USAGE_SAVE_FAILED: "Erreur d'enregistrement de l'utilisation. Veuillez réessayer.",
};

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    // ── 1. Lire le token depuis Authorization: Bearer <token> ──
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.', reason: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // ── 2. Vérifier le token côté serveur (service role) ───────
    // Le service role permet d'appeler auth.getUser(token)
    // sans dépendre des cookies ni de @supabase/ssr.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Session invalide ou expirée.', reason: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    // ── 3. Lire et valider le body ──────────────────────────
    // userId n'est jamais lu depuis le body — l'identité vient
    // exclusivement de user.id, issu du token vérifié ci-dessus.
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

    // ── 4. Appeler le moteur de consommation ───────────────
    const result = await redeemOffer({
      userId: user.id,
      offerId,
      establishmentId,
      amount: parseFloat(amount),
      pin,
    });

    // ── 5. Déclencher la validation des badges (non bloquant) ──
    try {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('category')
        .eq('id', establishmentId)
        .single();

      const host = req.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      await fetch(`${protocol}://${host}/api/badges/validate`, {
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
