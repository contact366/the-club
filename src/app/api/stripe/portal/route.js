import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
    }

    // Récupérer le stripe_customer_id depuis Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé pour cet utilisateur.' },
        { status: 404 }
      );
    }

    // Détection de l'URL de base
    const host = req.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const returnUrl = `${protocol}://${host}/profil`;

    // Créer une session Stripe Billing Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Erreur Stripe Portal:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}