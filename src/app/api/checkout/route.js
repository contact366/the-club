import { createMollieClient } from '@mollie/api-client';
import { NextResponse } from 'next/server';

const mollieClient = createMollieClient({ apiKey: 'test_FqTHus76PCAUqFAyMjrmvGAszHzw93' }); 

export async function POST(req) {
  try {
    const { plan, userId } = await req.json();
    const amount = plan === 'celeste' ? '59.00' : '9.90';

    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: amount },
      description: `The Club - Pass ${plan}`,
      // Retour sur ton localhost
      redirectUrl: `http://localhost:3000/?status=success`, 
      
      // TON ADRESSE NGROK (à vérifier dans ton terminal ngrok)
      webhookUrl: `https://TON_URL_NGROK_ACTUELLE.ngrok-free.app/api/webhook`, 
      
      metadata: { userId, plan },
    });

    return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch (error) {
    console.error("Erreur Mollie:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}