import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; // Ajuste le chemin si ton fichier supabase.js est ailleurs

// On initialise Stripe avec ta clé secrète (celle qui commence par sk_test_...)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // 1. On récupère l'ID de l'utilisateur envoyé par le bouton
    const { userId } = await req.json();

    // 2. On va chercher son numéro de client Stripe dans Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    // Si on ne trouve pas le client, on bloque
    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucun compte Stripe associé à ce profil." }, 
        { status: 400 }
      );
    }

    // 3. On détermine l'URL de retour de façon robuste
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    // Fallback : si la variable d'env est absente, on reconstruit l'URL depuis la requête
    if (!siteUrl) {
      const host = req.headers.get('host');
      const protocol = host.includes('localhost') ? 'http' : 'https';
      siteUrl = `${protocol}://${host}`;
    }
    // On s'assure qu'il n'y a pas de slash final pour éviter les doubles //
    siteUrl = siteUrl.replace(/\/$/, "");

    // On demande à Stripe de générer un lien d'accès unique et sécurisé
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/profil`,
    });

    // 4. On renvoie ce lien magique au site web
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erreur Stripe Portal:", error);
    return NextResponse.json({ error: "Erreur lors de la création du portail." }, { status: 500 });
  }
}