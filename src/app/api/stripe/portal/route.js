import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { plan, userEmail, userId } = await req.json();

    // On choisit l'ID du prix en fonction du plan reçu
    const priceId = plan === 'celeste'
      ? process.env.STRIPE_PRICE_CELESTE
      : process.env.STRIPE_PRICE_EXPLORER;

    if (!priceId) {
      return NextResponse.json({ error: `Plan inconnu ou prix non configuré : ${plan}` }, { status: 400 });
    }

    // On détecte l'URL de base (prod ou local) depuis la requête
    const host = req.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/profil?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      customer_email: userEmail,
      metadata: { userId, plan },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    console.error('Erreur Stripe Checkout:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}