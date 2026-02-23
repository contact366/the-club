import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Signature webhook invalide:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // On écoute uniquement les paiements d'abonnement confirmés
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, plan } = session.metadata;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          subscription_type: plan,
          updated_at: new Date(),
        });

      if (error) throw error;
      console.log(`✅ Profil mis à jour — userId: ${userId}, plan: ${plan}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erreur Webhook:', error.message);
    return new Response('Error', { status: 500 });
  }
}
