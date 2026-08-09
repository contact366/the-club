import { requireRole } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PLANS = ['aventurier', 'explorer', 'celeste', 'none'];

export async function POST(req, { params }) {
  const auth = await requireRole(req, ['super_admin', 'admin']);
  if (auth.error) return auth.error;
  const { supabaseAdmin, adminUser } = auth;
  const { id } = await params;

  try {
    const { plan } = await req.json();

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: `Plan invalide. Valeurs acceptées : ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      );
    }

    // Modifier uniquement subscription_type dans profiles
    // Ne touche pas à Stripe — modification administrative manuelle
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_type: plan === 'none' ? null : plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, subscription_type, updated_at')
      .single();

    if (error) throw error;

    console.log(`[admin/change-plan] Admin ${adminUser.id} → membre ${id} → plan: ${plan}`);

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error('[admin/members/[id]/change-plan]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
