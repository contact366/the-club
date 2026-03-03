import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId, badgeCode } = await req.json();

    if (!userId || !badgeCode) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Vérifier que le badge existe et est débloqué pour cet utilisateur
    const { data: badge } = await supabaseAdmin
      .from('badges')
      .select('id, code, required_count')
      .eq('code', badgeCode)
      .single();

    if (!badge) {
      return NextResponse.json({ error: 'Badge introuvable' }, { status: 404 });
    }

    const { data: progress } = await supabaseAdmin
      .from('user_badges_progress')
      .select('is_unlocked')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    if (!progress?.is_unlocked) {
      return NextResponse.json({ error: 'Badge non débloqué' }, { status: 403 });
    }

    // 2. Récupérer le profil utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, insider_access')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const plan = profile.subscription_type?.toLowerCase() || '';

    // 3. Appliquer les récompenses selon le badge et le plan
    if (badgeCode === 'riviera_explorer') {
      if (plan.includes('explorer')) {
        // Vérifier qu'on n'a pas déjà donné ce bonus
        const { data: existingCredit } = await supabaseAdmin
          .from('user_bonus_credits')
          .select('id')
          .eq('user_id', userId)
          .eq('credit_type', 'badge_riviera_explorer')
          .maybeSingle();

        if (existingCredit) {
          return NextResponse.json({ success: true, message: 'Récompense déjà réclamée', alreadyClaimed: true });
        }

        // Ajouter 1 crédit découverte bonus valable 30 jours
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabaseAdmin
          .from('user_bonus_credits')
          .insert({
            user_id: userId,
            credit_type: 'badge_riviera_explorer',
            expires_at: expiresAt.toISOString(),
            is_used: false,
          });

        return NextResponse.json({ success: true, reward: 'bonus_credit', message: 'Crédit découverte bonus ajouté (30 jours)' });

      } else if (plan.includes('celeste') || plan.includes('céleste')) {
        if (profile.insider_access) {
          return NextResponse.json({ success: true, message: 'Accès insider déjà activé', alreadyClaimed: true });
        }

        await supabaseAdmin
          .from('profiles')
          .update({ insider_access: true })
          .eq('id', userId);

        return NextResponse.json({ success: true, reward: 'insider_access', message: 'Accès insider activé !' });
      }
    }

    return NextResponse.json({ success: true, message: 'Aucune récompense applicable pour ce badge/plan' });

  } catch (error) {
    console.error('Erreur API badges/reward:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
