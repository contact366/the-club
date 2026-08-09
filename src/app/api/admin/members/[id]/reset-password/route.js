import { requireRole } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const auth = await requireRole(req, ['super_admin', 'admin', 'support']);
  if (auth.error) return auth.error;
  const { supabaseAdmin, adminUser } = auth;
  const { id } = await params;

  try {
    // Récupérer l'email réel depuis la base — jamais depuis le body
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single();

    if (profileErr || !profile?.email) {
      return NextResponse.json({ error: 'Membre introuvable ou sans email.' }, { status: 404 });
    }

    // Utiliser Supabase Auth pour envoyer le lien (ne manipule jamais le mot de passe)
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
    });

    if (error) throw error;

    console.log(`[admin/reset-password] Admin ${adminUser.id} → reset pour membre ${id} (${profile.email})`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/members/[id]/reset-password]', err.message);
    return NextResponse.json({ error: 'Erreur lors de la génération du lien.' }, { status: 500 });
  }
}
