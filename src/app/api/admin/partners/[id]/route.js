import { requireAdmin, requireRole } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Colonnes autorisées en modification (jamais id, created_at)
const PATCHABLE = [
  'name', 'slug', 'category', 'address', 'phone', 'website', 'instagram',
  'photo_url', 'image_url', 'offer_decouverte', 'offer_permanente',
  'discount_decouverte', 'discount_permanente', 'pin_code',
  'decouverte_offer', 'permanent_offer', 'is_active',
];

// ── GET /api/admin/partners/[id] ───────────────────────────────
export async function GET(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    const [partnerRes, offersRes, accountsRes, statsRes] = await Promise.all([
      // Partenaire complet
      supabaseAdmin.from('partners').select('*').eq('id', id).single(),

      // Offres liées
      supabaseAdmin
        .from('offers')
        .select('id, title, offer_type, is_active, access_level, valid_from, valid_until, ' +
          'aventurier_enabled, aventurier_benefit_type, aventurier_benefit_value, aventurier_benefit_label, ' +
          'explorer_enabled, explorer_benefit_type, explorer_benefit_value, explorer_benefit_label, ' +
          'celeste_enabled, celeste_benefit_type, celeste_benefit_value, celeste_benefit_label')
        .eq('partner_id', id)
        .order('is_active', { ascending: false }),

      // Comptes partenaire
      supabaseAdmin
        .from('partner_accounts')
        .select('id, user_id, role, created_at, profiles:user_id(email, first_name, last_name)')
        .eq('partner_id', id),

      // Stats depuis utilisations (derniers 90 jours)
      supabaseAdmin
        .from('utilisations')
        .select('id, user_id, offer_type, original_amount, saved_amount, created_at')
        .eq('establishment_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (partnerRes.error || !partnerRes.data) {
      return NextResponse.json({ error: 'Partenaire introuvable.' }, { status: 404 });
    }

    // Agréger les stats
    const usages = statsRes.data || [];
    const uniqueUsers = new Set(usages.map(u => u.user_id)).size;
    const totalRevenue  = usages.reduce((s, u) => s + (parseFloat(u.original_amount) || 0), 0);
    const totalSavings  = usages.reduce((s, u) => s + (parseFloat(u.saved_amount)    || 0), 0);
    const byType = {};
    for (const u of usages) {
      byType[u.offer_type || 'autre'] = (byType[u.offer_type || 'autre'] || 0) + 1;
    }

    return NextResponse.json({
      partner:  partnerRes.data,
      offers:   offersRes.data  || [],
      accounts: accountsRes.data || [],
      stats: {
        totalUsages: usages.length,
        uniqueUsers,
        totalRevenue:  Math.round(totalRevenue  * 100) / 100,
        totalSavings:  Math.round(totalSavings  * 100) / 100,
        byType,
        recentUsages: usages.slice(0, 15),
      },
    });
  } catch (err) {
    console.error('[admin/partners/[id] GET]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/partners/[id] ────────────────────────────
export async function PATCH(req, { params }) {
  const auth = await requireRole(req, ['super_admin', 'admin', 'partner_manager']);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    const body = await req.json();

    const updates = {};
    for (const key of PATCHABLE) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select('id, name, is_active, category, updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ partner: data });
  } catch (err) {
    console.error('[admin/partners/[id] PATCH]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
