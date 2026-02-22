import { createMollieClient } from '@mollie/api-client';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const mollieClient = createMollieClient({ apiKey: 'test_FqTHus76PCAUqFAyMjrmvGAszHzw93' });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const paymentId = formData.get('id');
    const payment = await mollieClient.payments.get(paymentId);

    if (payment.isPaid()) {
      const { userId, plan } = payment.metadata;

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          subscription_type: plan,
          updated_at: new Date()
        });

      if (error) throw error;
      console.log("✅ Profil mis à jour en local !");
    }

    return new Response('OK');
  } catch (error) {
    console.error("❌ Erreur Webhook:", error.message);
    return new Response('Error', { status: 500 });
  }
}