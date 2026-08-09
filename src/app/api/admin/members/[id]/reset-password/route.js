import { requireRole } from '@/lib/admin/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  // 1. Vérification admin (rôle + is_active via service role)
  const auth = await requireRole(req, ['super_admin', 'admin', 'support']);
  if (auth.error) return auth.error;
  const { supabaseAdmin, adminUser } = auth;
  const { id } = await params;

  try {
    // 2. Récupérer l'email réel depuis la base — jamais depuis le body du client
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single();

    if (profileErr || !profile?.email) {
      return NextResponse.json({ error: 'Membre introuvable ou sans email.' }, { status: 404 });
    }

    // 3. Envoyer l'email de récupération via resetPasswordForEmail.
    //
    //    POURQUOI PAS generateLink() ?
    //    auth.admin.generateLink({ type: 'recovery' }) génère uniquement un lien signé
    //    en retour JSON — il ne déclenche aucun envoi d'email. C'est une API destinée
    //    aux flux où l'email est géré manuellement (ex. Resend, SMTP custom).
    //
    //    resetPasswordForEmail() déclenche l'envoi de l'email de récupération
    //    via le serveur SMTP configuré dans Supabase Authentication.
    //    Cette méthode n'est disponible que sur le client "anon" (pas service role).
    //    On crée donc un client anon dédié à cet appel unique.
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theclub-app.fr';

    const { error: resetError } = await supabaseAnon.auth.resetPasswordForEmail(
      profile.email,
      { redirectTo: `${siteUrl}/update-password` }
    );

    if (resetError) {
      console.error('[admin/reset-password] Supabase error:', resetError.message);
      return NextResponse.json(
        { error: `Envoi impossible : ${resetError.message}` },
        { status: 500 }
      );
    }

    console.log(
      `[admin/reset-password] Admin ${adminUser.id} → email de récupération envoyé ` +
      `pour membre ${id} (${profile.email})`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/members/[id]/reset-password]', err.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
