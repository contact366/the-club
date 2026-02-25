import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Désactive le body parsing de Next.js pour cette route (requis pour Stripe webhook)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Signature webhook invalide:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log('📩 Événement Stripe reçu:', event.type);

    // Client Supabase ADMIN créé à l'exécution (contourne le RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      const customerEmail = session.customer_details?.email;
      const stripeCustomerId = session.customer;

      console.log(`🔍 Vérification : userId=${userId}, plan=${plan}, email=${customerEmail}, stripeCustomerId=${stripeCustomerId}`);

      if (!userId) {
        console.error("❌ Erreur : Aucun userId trouvé dans les metadata de la session Stripe");
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }

      // MISE À JOUR DE SUPABASE
      const updateData = {
        subscription_type: plan,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString()
      };

      if (plan === 'aventurier') {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72);
        updateData.expires_at = expiresAt.toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
              from: process.env.EMAIL_FROM || 'The Club <bienvenue@theclub-app.fr>',
              reply_to: 'contact@instantandyou.fr',
              to: customerEmail,
              subject: `Bienvenue au Club, ${plan} !`,
              html: `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Bienvenue au Club</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      table { border-collapse: collapse; }
      a { color: inherit; text-decoration: none; }
    </style>
  </head>
  <body>
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Votre abonnement est actif, découvrez vos avantages</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;">
      <tbody>
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background-color:#111111;padding:40px 40px 32px 40px;text-align:center;">
                    <p style="margin:0;font-size:48px;line-height:1;">🌴</p>
                    <h1 style="margin:16px 0 0 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Bienvenue au Club.</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.6;">
                      Votre abonnement est actif.<br/>Profitez dès maintenant de vos avantages.
                    </p>
                    <p style="margin:0 0 32px 0;font-size:15px;color:#6b7280;line-height:1.6;">
                      Votre pass <strong style="color:#111111;">${plan}</strong> vous donne accès à toutes les offres exclusives réservées aux membres du Club.
                    </p>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tbody>
                        <tr>
                          <td style="border-radius:10px;background-color:#111111;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://theclub-app.fr'}/profil"
                               style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                              Accéder à mon espace
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 40px 40px;border-top:1px solid #f3f4f6;">
                    <p style="margin:24px 0 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      Merci pour votre confiance.<br/>L'équipe The Club
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
            }),
          });
          console.log(`📧 Email de confirmation envoyé à ${customerEmail}`);
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email (non bloquant):', emailError.message);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const stripeCustomerId = subscription.customer;

      console.log(`🔍 Annulation détectée pour le customer: ${stripeCustomerId}`);

      // Remettre le subscription_type à null pour retirer le badge
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_type: null, 
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', stripeCustomerId)
        .select();

      if (error) {
        console.error('❌ Erreur Supabase lors de l\'annulation:', error.message);
        throw error;
      }

      console.log(`✅ Abonnement annulé avec succès pour le customer: ${stripeCustomerId}`, data);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Erreur Webhook:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Répondre aux autres méthodes HTTP pour éviter les erreurs 405
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint actif. Utilisez POST.' }, { status: 200 });
}