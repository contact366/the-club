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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?status=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/?status=cancel`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Erreur Stripe:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
