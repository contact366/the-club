import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Récupérer le profil pour avoir le stripe_customer_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    // 2. Annuler l'abonnement Stripe actif (si le client Stripe existe)
    if (profile?.stripe_customer_id) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
        console.log(`✅ Abonnements Stripe annulés pour le customer: ${profile.stripe_customer_id}`);
      } catch (stripeError) {
        console.error('⚠️ Erreur annulation Stripe (non bloquant):', stripeError.message);
        // On continue même si Stripe échoue — la suppression du compte est prioritaire
      }
    }

    // 3. Supprimer les utilisations (historique des offres)
    const { error: deleteUtilisationsError } = await supabaseAdmin
      .from('utilisations')
      .delete()
      .eq('user_id', userId);

    if (deleteUtilisationsError) {
      console.error('⚠️ Erreur suppression utilisations:', deleteUtilisationsError.message);
    }

    // 4. Supprimer l'avatar du Storage (si existant)
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId);

      if (avatarFiles && avatarFiles.length > 0) {
        const filesToRemove = avatarFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filesToRemove);
        console.log(`✅ Avatar supprimé pour userId: ${userId}`);
      }
    } catch (storageError) {
      console.error('⚠️ Erreur suppression avatar (non bloquant):', storageError.message);
    }

    // 5. Supprimer le profil dans la table profiles
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('❌ Erreur suppression profil:', deleteProfileError.message);
      return NextResponse.json({ error: 'Erreur lors de la suppression du profil.' }, { status: 500 });
    }

    // 6. Supprimer le compte auth via Supabase Admin
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('❌ Erreur suppression auth:', deleteAuthError.message);
      return NextResponse.json({ error: 'Erreur lors de la suppression du compte.' }, { status: 500 });
    }

    console.log(`✅ Compte supprimé avec succès — userId: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur delete-account:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
