import { requireAdmin, requireRole } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── GET /api/admin/members/[id] ────────────────────────────────
export async function GET(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    // Profil complet
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Membre introuvable.' }, { status: 404 });
    }

    // Données liées en parallèle
    const [badgesRes, creditsRes, usageRes, favoritesRes] = await Promise.all([
      // Badges + progression
      supabaseAdmin
        .from('user_badges_progress')
        .select('id, current_count, is_unlocked, unlocked_at, badges:badge_id(code, name, description, required_count, icon_url)')
        .eq('user_id', id),

      // Crédits bonus
      supabaseAdmin
        .from('user_bonus_credits')
        .select('*')
        .eq('user_id', id),

      // Dernières utilisations
      supabaseAdmin
        .from('offer_usage')
        .select('id, used_at, offer_type, offers:offer_uuid(title, partner_id, partners:partner_id(name))')
        .eq('user_id', id)
        .order('used_at', { ascending: false })
        .limit(20),

      // Favoris avec nom du partenaire
      supabaseAdmin
        .from('favorites')
        .select('id, partner_id, partners:partner_id(name, category)')
        .eq('user_id', id),
    ]);

    return NextResponse.json({
      profile,
      badges:    badgesRes.data   || [],
      credits:   creditsRes.data  || [],
      usage:     usageRes.data    || [],
      favorites: favoritesRes.data || [],
    });
  } catch (err) {
    console.error('[admin/members/[id] GET]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/members/[id] ─────────────────────────────
// Champs autorisés uniquement (jamais id, stripe, montant, etc.)
const PATCHABLE_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'gender', 'birth_date', 'newsletter', 'sms_alerts'];

export async function PATCH(req, { params }) {
  const auth = await requireRole(req, ['super_admin', 'admin', 'support']);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    const body = await req.json();

    // Filtrer les champs autorisés
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide à mettre à jour.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, first_name, last_name, email, phone, gender, birth_date, newsletter, sms_alerts, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[admin/members/[id] PATCH]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}

// ── DELETE /api/admin/members/[id] ────────────────────────────
export async function DELETE(req, { params }) {
  const auth = await requireRole(req, ['super_admin']);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    // Récupérer stripe_customer_id avant suppression
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', id)
      .single();

    // Annuler les abonnements Stripe actifs (non bloquant)
    if (profile?.stripe_customer_id) {
      try {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'active' });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      } catch (stripeErr) {
        console.error('[admin/members delete] Stripe (non bloquant):', stripeErr.message);
      }
    }

    // Supprimer l'utilisateur Supabase Auth (cascade supprime profiles via FK)
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) throw authErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/members/[id] DELETE]', err.message);
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
