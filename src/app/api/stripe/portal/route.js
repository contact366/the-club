import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { plan, userId } = await req.json();

    console.log("LE MOT REÇU PAR LE SERVEUR EST :", plan);

    let priceId = "";
    if (plan === 'celeste') {
      priceId = process.env.STRIPE_PRICE_CELESTE;
    } else if (plan === 'cercle') {
      priceId = process.env.STRIPE_PRICE_CERCLE;
    } else if (plan === 'aventurier') {
      priceId = process.env.STRIPE_PRICE_AVENTURIER;
    } else {
      priceId = process.env.STRIPE_PRICE_EXPLORER;
    }
    

    if (!priceId) {
      return NextResponse.json({ error: `Prix non configuré pour le plan : ${plan}` }, { status: 400 });
    }

    // Détection de l'URL de base (prod ou local) depuis la requête
    const host = req.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profil?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Erreur Stripe:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}