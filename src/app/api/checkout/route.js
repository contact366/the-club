import { createMollieClient } from '@mollie/api-client';
import { supabase } from '@/lib/supabase'; // Vérifie ce chemin !

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export async function POST(req) {
  try {
    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: '9.90' }, // Ton prix
      description: 'Abonnement Céleste - The Club',
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/webhook`,
      metadata: { userId: 'ID_DE_L_UTILISATEUR' }
    });

    return new Response(JSON.stringify({ checkoutUrl: payment.getCheckoutUrl() }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}