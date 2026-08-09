import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId, establishmentId, partnerCategory } = await req.json();

    if (!userId || !establishmentId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Récupérer le profil pour vérifier le plan d'abonnement
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type')
      .eq('id', userId)
      .single();

    const plan = profile?.subscription_type?.toLowerCase() || '';
    const category = (partnerCategory || '').toLowerCase();

    // Récupérer tous les badges actifs
    const { data: allBadges } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (!allBadges || allBadges.length === 0) {
      return NextResponse.json({ success: true, updatedBadges: [] });
    }

    // Déterminer les badges concernés par cette validation
    const applicableBadges = allBadges.filter(badge => {
      // Vérifier le plan requis (badge gold réservé aux abonnés céleste)
      if (badge.plan_required === 'celeste' && !plan.includes('celeste') && !plan.includes('céleste')) {
        return false;
      }

      // Filtrer selon le code du badge et la catégorie du partenaire
      switch (badge.code) {
        case 'riviera_explorer':
          return true; // Tous les établissements comptent
        case 'riviera_gourmet':
          return category.includes('gastronomie');
        case 'riviera_wellness':
          return (
            category.includes('bien-être') ||
            category.includes('bien-etre') ||
            category.includes('hotel') ||
            category.includes('hôtel') ||
            category.includes('spa')
          );
        case 'gold_riviera_insider':
          return true; // Tous les établissements (filtre plan déjà appliqué ci-dessus)
        default:
          return false;
      }
    });

    const updatedBadges = [];

    for (const badge of applicableBadges) {
      // Vérifier si cet établissement a déjà été validé pour ce badge par cet utilisateur
      // (un établissement ne compte qu'une seule fois par badge)
      const { data: existingValidation } = await supabaseAdmin
        .from('user_establishment_validations')
        .select('id')
        .eq('user_id', userId)
        .eq('establishment_id', establishmentId)
        .eq('badge_id', badge.id)
        .maybeSingle();

      if (existingValidation) continue; // Déjà validé pour ce badge, on passe au suivant

      // Enregistrer la validation de cet établissement pour ce badge
      const { error: validationError } = await supabaseAdmin
        .from('user_establishment_validations')
        .insert({
          user_id: userId,
          establishment_id: establishmentId,
          badge_id: badge.id,
        });

      if (validationError) {
        console.error(`Erreur insertion validation badge ${badge.code}:`, validationError.message);
        continue;
      }

      // Récupérer la progression existante de l'utilisateur pour ce badge
      const { data: progress } = await supabaseAdmin
        .from('user_badges_progress')
        .select('id, current_count, is_unlocked')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .maybeSingle();

      let newCount = 1;
      let justUnlocked = false;

      if (progress) {
        // Mettre à jour la progression existante
        newCount = progress.current_count + 1;
        const updateData = { current_count: newCount };

        if (newCount >= badge.required_count && !progress.is_unlocked) {
          updateData.is_unlocked = true;
          updateData.unlocked_at = new Date().toISOString();
          justUnlocked = true;
        }

        const { error: updateError } = await supabaseAdmin
          .from('user_badges_progress')
          .update(updateData)
          .eq('id', progress.id);

        if (updateError) {
          console.error(`Erreur mise à jour progression badge ${badge.code}:`, updateError.message);
          continue;
        }
      } else {
        // Créer une nouvelle ligne de progression
        const isUnlocked = newCount >= badge.required_count;
        justUnlocked = isUnlocked;

        const { error: insertError } = await supabaseAdmin
          .from('user_badges_progress')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            current_count: newCount,
            is_unlocked: isUnlocked,
            unlocked_at: isUnlocked ? new Date().toISOString() : null,
          });

        if (insertError) {
          console.error(`Erreur insertion progression badge ${badge.code}:`, insertError.message);
          continue;
        }
      }

      updatedBadges.push({
        badgeCode: badge.code,
        currentCount: newCount,
        requiredCount: badge.required_count,
        justUnlocked,
      });
    }

    return NextResponse.json({ success: true, updatedBadges });

  } catch (error) {
    console.error('Erreur API badges/validate:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
