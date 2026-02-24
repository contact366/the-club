import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Client Supabase ADMIN — contourne le RLS pour écrire depuis le serveur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      const customerEmail = session.customer_details?.email;

      console.log(`🔍 Vérification : userId=${userId}, plan=${plan}, email=${customerEmail}`);

      if (!userId) {
        console.error("❌ Erreur : Aucun userId trouvé dans les metadata de la session Stripe");
        return new Response('Missing userId', { status: 400 });
      }

      // MISE À JOUR DE SUPABASE (avec le client admin qui contourne le RLS)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_type: plan, 
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', error.message);
        throw error;
      }
      
      console.log(`✅ Profil mis à jour avec succès — Plan: ${plan}`, data);

      // ENVOI D'EMAIL DE CONFIRMATION
      if (customerEmail && process.env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'The Club <noreply@theclub.fr>',
              to: customerEmail,
              subject: `🎉 Bienvenue dans le Pass ${plan} !`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="font-size: 28px; color: #111; margin-bottom: 16px;">Bienvenue dans The Club !</h1>
                  <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Ton abonnement <strong>Pass ${plan}</strong> est maintenant actif. 🎉
                  </p>
                  <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Tu peux dès maintenant accéder à ton espace membre et profiter de toutes les offres exclusives.
                  </p>
                  <div style="margin: 32px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://theclub.fr'}/profil" 
                       style="background-color: #111; color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Accéder à mon espace
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #999; margin-top: 40px;">
                    Merci pour ta confiance.<br/>L'équipe The Club
                  </p>
                </div>
              `,
            }),
          });
          console.log(`📧 Email de confirmation envoyé à ${customerEmail}`);
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email (non bloquant):', emailError.message);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erreur Webhook:', error.message);
    return new Response('Error', { status: 500 });
  }
}