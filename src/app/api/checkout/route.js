import { createMollieClient } from '@mollie/api-client';
import { NextResponse } from 'next/server';

// Initialisation du client Mollie avec ta clé API (Test ou Live)
const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY 
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, email, plan } = body;

    // 1. Définition de l'URL de base (Vercel ou Localhost)
    // IMPORTANT : NEXT_PUBLIC_SITE_URL doit être configuré dans Vercel
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 2. Création du paiement chez Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: '9.90', // Ajuste le prix ici si besoin
      },
      description: `Abonnement ${plan || 'Céleste'} - The Club`,
      
      // On utilise des URLs ABSOLUES pour éviter l'erreur "Invalid Redirect URL"
      redirectUrl: `${siteUrl}/success`,
      webhookUrl: `${siteUrl}/api/checkout/webhook`,
      
      metadata: {
        userId: userId, // On stocke l'ID pour le récupérer dans le webhook
        email: email
      },
    });

    // 3. On renvoie l'URL de paiement à ton interface
    return NextResponse.json({ 
      checkoutUrl: payment.getCheckoutUrl() 
    });

  } catch (error) {
    console.error('Erreur Mollie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' }, 
      { status: 500 }
    );
  }
}