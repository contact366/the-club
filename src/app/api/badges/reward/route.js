import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId, badgeId } = await req.json();

    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId et badgeId sont requis' }, { status: 400 });
    }

    if (!['explorer', 'insider'].includes(badgeId)) {
      return NextResponse.json({ error: 'badgeId invalide' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Récupérer le profil pour vérifier l'éligibilité et les flags
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, badge_rewarded_explorer, badge_rewarded_insider, bonus_discovery_credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const planName = (profile.subscription_type || '').toLowerCase();
    const isCeleste = planName.includes('celeste') || planName.includes('céleste');

    // Vérifier le double-claim
    if (badgeId === 'explorer' && profile.badge_rewarded_explorer) {
      return NextResponse.json({ error: 'Récompense déjà réclamée' }, { status: 409 });
    }
    if (badgeId === 'insider' && profile.badge_rewarded_insider) {
      return NextResponse.json({ error: 'Récompense déjà réclamée' }, { status: 409 });
    }

    // Vérifier que le badge est bien débloqué (recalcul côté serveur)
    const { data: utilisations } = await supabaseAdmin
      .from('utilisations')
      .select('establishment_id')
      .eq('user_id', userId);

    const distinctCount = new Set((utilisations || []).map(u => u.establishment_id)).size;

    if (badgeId === 'explorer' && distinctCount < 3) {
      return NextResponse.json({ error: 'Badge non débloqué' }, { status: 403 });
    }
    if (badgeId === 'insider' && distinctCount < 6) {
      return NextResponse.json({ error: 'Badge non débloqué' }, { status: 403 });
    }
    if (badgeId === 'insider' && !isCeleste) {
      return NextResponse.json({ error: 'Abonnement Céleste requis' }, { status: 403 });
    }

    // Appliquer la récompense
    let updateData = {};

    if (badgeId === 'explorer') {
      updateData.badge_rewarded_explorer = true;
      if (isCeleste) {
        updateData.insider_access = true;
      } else {
        // Récupérer les crédits actuels pour incrémenter
        const currentCredits = profile.bonus_discovery_credits || 0;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        updateData.bonus_discovery_credits = currentCredits + 1;
        updateData.bonus_credits_expires_at = expiresAt.toISOString();
      }
    } else if (badgeId === 'insider') {
      updateData.badge_rewarded_insider = true;
      updateData.insider_access = true;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
