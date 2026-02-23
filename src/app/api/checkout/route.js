import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  explorer: 'price_1T3olEJzvSvGGuRTdVsN0i3C',
  celeste:  'price_1T3olZJzvSvGGuRTyl5ZWA8r',
};

export async function POST(req) {
  try {
    const { plan, userId } = await req.json();

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: `Plan inconnu : ${plan}` }, { status: 400 });
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