import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // RÉCUPÉRATION DES INFOS
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      console.log(`Vérification : userId=${userId}, plan=${plan}`);

      if (!userId) {
        console.error("❌ Erreur : Aucun userId trouvé dans les metadata de la session Stripe");
        return new Response('Missing userId', { status: 400 });
      }

      // MISE À JOUR DE SUPABASE
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_type: plan, 
          updated_at: new Date() 
        })
        .eq('id', userId); // On cible le bon utilisateur par son ID

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', error.message);
        throw error;
      }
      
      console.log(`✅ Profil mis à jour avec succès — Plan: ${plan}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erreur Webhook:', error.message);
    return new Response('Error', { status: 500 });
  }
}