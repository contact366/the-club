import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

// ── GET /api/admin/partners ────────────────────────────────────
export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;

  const { searchParams } = new URL(req.url);
  const search   = (searchParams.get('search') || '').trim();
  const category = searchParams.get('category') || 'all';
  const statut   = searchParams.get('statut')   || 'all';
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const from     = (page - 1) * PAGE_SIZE;
  const to       = from + PAGE_SIZE - 1;

  try {
    let query = supabaseAdmin
      .from('partners')
      .select(
        'id, name, slug, category, address, phone, website, photo_url, image_url, ' +
        'is_active, affluence_status, pin_code, offer_decouverte, offer_permanente, ' +
        'discount_decouverte, discount_permanente, created_at',
        { count: 'exact' }
      );

    // Recherche texte
    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Filtre catégorie
    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    // Filtre statut
    if (statut === 'actif') {
      query = query.eq('is_active', true);
    } else if (statut === 'inactif') {
      query = query.eq('is_active', false);
    }

    query = query.order('name', { ascending: true }).range(from, to);

    const { data: partners, count, error } = await query;
    if (error) throw error;

    // Compter les offres par partenaire en une seule requête
    const partnerIds = (partners || []).map(p => p.id);
    let offerCounts = {};
    let usageCounts = {};

    if (partnerIds.length > 0) {
      const { data: offers } = await supabaseAdmin
        .from('offers')
        .select('partner_id')
        .in('partner_id', partnerIds)
        .eq('is_active', true);

      if (offers) {
        for (const o of offers) {
          offerCounts[o.partner_id] = (offerCounts[o.partner_id] || 0) + 1;
        }
      }

      const { data: usages } = await supabaseAdmin
        .from('utilisations')
        .select('establishment_id')
        .in('establishment_id', partnerIds);

      if (usages) {
        for (const u of usages) {
          usageCounts[u.establishment_id] = (usageCounts[u.establishment_id] || 0) + 1;
        }
      }
    }

    const result = (partners || []).map(p => ({
      ...p,
      offer_count:  offerCounts[p.id]  || 0,
      usage_count:  usageCounts[p.id]  || 0,
    }));

    return NextResponse.json({ partners: result, total: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('[admin/partners GET]', err.message);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}

// ── POST /api/admin/partners ───────────────────────────────────
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  const { supabaseAdmin } = auth;

  try {
    const body = await req.json();

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Le nom du partenaire est requis.' }, { status: 400 });
    }

    // Colonnes autorisées à la création — alignées avec la structure réelle de partners
    const allowed = [
      'name', 'slug', 'category', 'address', 'phone', 'website', 'instagram',
      'photo_url', 'image_url', 'offer_decouverte', 'offer_permanente',
      'discount_decouverte', 'discount_permanente', 'pin_code',
      'decouverte_offer', 'permanent_offer', 'is_active',
    ];

    const payload = { is_active: true }; // défaut
    for (const key of allowed) {
      if (key in body && body[key] !== undefined && body[key] !== '') {
        payload[key] = body[key];
      }
    }

    // Générer un slug si absent
    if (!payload.slug && payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const { data, error } = await supabaseAdmin
      .from('partners')
      .insert(payload)
      .select('id, name')
      .single();

    if (error) throw error;

    return NextResponse.json({ partner: data }, { status: 201 });
  } catch (err) {
    console.error('[admin/partners POST]', err.message);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
