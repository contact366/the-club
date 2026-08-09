import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const search   = (searchParams.get('search') || '').trim();
    const pass     = searchParams.get('pass')   || 'all';
    const statut   = searchParams.get('statut') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const from     = (page - 1) * PAGE_SIZE;
    const to       = from + PAGE_SIZE - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select(
        'id, first_name, last_name, email, phone, subscription_type, expires_at, ' +
        'montant_economise, created_at, avatar_url, referral_code, referral_count, ' +
        'subscription_started_at, stripe_customer_id, insider_access',
        { count: 'exact' }
      );

    // Filtre recherche (ilike sur prénom, nom, email)
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Filtre pass
    if (pass && pass !== 'all') {
      if (pass === 'sans_abonnement') {
        query = query.or('subscription_type.is.null,subscription_type.eq.,subscription_type.eq.none');
      } else {
        query = query.ilike('subscription_type', pass);
      }
    }

    // Filtre statut (calculé via expires_at)
    const now = new Date().toISOString();
    if (statut === 'actif') {
      query = query.or(`expires_at.is.null,expires_at.gte.${now}`).not('subscription_type', 'is', null).not('subscription_type', 'eq', '').not('subscription_type', 'eq', 'none');
    } else if (statut === 'expire') {
      query = query.lt('expires_at', now);
    } else if (statut === 'sans_abonnement') {
      query = query.or('subscription_type.is.null,subscription_type.eq.,subscription_type.eq.none');
    }

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ members: data || [], total: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('[admin/members GET]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
