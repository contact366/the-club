import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // DIAGNOSTIC 1 : Vérification de la clé Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "La clé STRIPE_SECRET_KEY est manquante dans Vercel" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await req.json();
    const { userId, email, priceId } = body;

    // DIAGNOSTIC 2 : Vérification des données reçues
    if (!priceId) {
      return NextResponse.json({ error: "Le Price ID est manquant dans l'appel du bouton" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-club-flame.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata: { userId: userId },
    });

    return NextResponse.json({ checkoutUrl: session.url });

  } catch (error) {
    // DIAGNOSTIC 3 : Capture de l'erreur réelle
    console.error("Erreur détaillée Stripe:", error);
    return NextResponse.json({ 
      error: "Crash du serveur", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}