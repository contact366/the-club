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

  // ── ÉTAPE 1 : requête de base (colonnes dont l'existence est certifiée) ──
  // On commence par le strict minimum et on ajoute progressivement.
  // Si is_active n'existe pas encore (migration non jouée), on l'exclut.
  console.log('[admin/partners] STEP 1 — requête de base partners');

  let baseQuery = supabaseAdmin
    .from('partners')
    .select('id, name, slug, category, address', { count: 'exact' });

  if (search) {
    baseQuery = baseQuery.or(
      `name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%`
    );
  }
  if (category && category !== 'all') {
    baseQuery = baseQuery.ilike('category', `%${category}%`);
  }

  baseQuery = baseQuery.order('name', { ascending: true }).range(from, to);

  const { data: basePartners, count, error: baseError } = await baseQuery;

  if (baseError) {
    console.error('[admin/partners] STEP 1 FAIL — table/colonnes de base introuvables');
    console.error('[admin/partners] Code Supabase :', baseError.code);
    console.error('[admin/partners] Message       :', baseError.message);
    console.error('[admin/partners] Détail        :', baseError.details);
    console.error('[admin/partners] Hint          :', baseError.hint);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }

  console.log(`[admin/partners] STEP 1 OK — ${basePartners?.length ?? 0} résultats (total: ${count})`);

  const partners = basePartners || [];
  const partnerIds = partners.map(p => p.id);

  // ── ÉTAPE 2 : colonnes optionnelles (peuvent ne pas exister) ──
  // Tentative de récupérer les colonnes étendues pour les partenaires visibles.
  // Si la colonne n'existe pas (migration non jouée), on utilise les valeurs par défaut.
  console.log('[admin/partners] STEP 2 — colonnes étendues (phone, website, photo_url, is_active, etc.)');

  let extendedMap = {};
  if (partnerIds.length > 0) {
    const { data: extended, error: extErr } = await supabaseAdmin
      .from('partners')
      .select(
        'id, phone, website, instagram, photo_url, image_url, ' +
        'is_active, affluence_status, pin_code, ' +
        'offer_decouverte, offer_permanente, discount_decouverte, discount_permanente, created_at'
      )
      .in('id', partnerIds);

    if (extErr) {
      // Logguer précisément pour identifier quelle colonne manque
      console.warn('[admin/partners] STEP 2 WARN — colonnes étendues indisponibles (migration peut-être non jouée)');
      console.warn('[admin/partners] Code :', extErr.code);
      console.warn('[admin/partners] Msg  :', extErr.message);
      console.warn('[admin/partners] Hint :', extErr.hint);
      // Tentative de secours : uniquement photo_url (colonne probable)
      const { data: fallback, error: fallErr } = await supabaseAdmin
        .from('partners')
        .select('id, photo_url, image_url, affluence_status')
        .in('id', partnerIds);
      if (fallErr) {
        console.warn('[admin/partners] STEP 2 FALLBACK FAIL :', fallErr.message);
      } else if (fallback) {
        for (const r of fallback) extendedMap[r.id] = r;
        console.log('[admin/partners] STEP 2 FALLBACK OK');
      }
    } else if (extended) {
      for (const r of extended) extendedMap[r.id] = r;
      console.log('[admin/partners] STEP 2 OK — colonnes étendues disponibles');
    }
  }

  // Filtre statut (seulement si is_active est disponible)
  let finalPartners = partners;
  const hasIsActive = partnerIds.length === 0 || extendedMap[partnerIds[0]]?.is_active !== undefined;

  if (hasIsActive && (statut === 'actif' || statut === 'inactif')) {
    const target = statut === 'actif';
    finalPartners = partners.filter(p => {
      const ext = extendedMap[p.id];
      // Si is_active undefined (colonne absente), considérer comme actif
      const active = ext?.is_active !== false;
      return target ? active : !active;
    });
  }

  // ── ÉTAPE 3 : compter les offres ──────────────────────────────
  console.log('[admin/partners] STEP 3 — comptage offres');
  let offerCounts = {};

  if (partnerIds.length > 0) {
    const { data: offers, error: offErr } = await supabaseAdmin
      .from('offers')
      .select('partner_id')
      .in('partner_id', partnerIds)
      .eq('is_active', true);

    if (offErr) {
      console.warn('[admin/partners] STEP 3 offres WARN :', offErr.code, offErr.message);
    } else if (offers) {
      for (const o of offers) {
        offerCounts[o.partner_id] = (offerCounts[o.partner_id] || 0) + 1;
      }
      console.log('[admin/partners] STEP 3 OK — offres comptées');
    }
  }

  // ── ÉTAPE 4 : compter les utilisations ───────────────────────
  console.log('[admin/partners] STEP 4 — comptage utilisations');
  let usageCounts = {};

  if (partnerIds.length > 0) {
    const { data: usages, error: useErr } = await supabaseAdmin
      .from('utilisations')
      .select('establishment_id')
      .in('establishment_id', partnerIds);

    if (useErr) {
      console.warn('[admin/partners] STEP 4 utilisations WARN :', useErr.code, useErr.message);
    } else if (usages) {
      for (const u of usages) {
        usageCounts[u.establishment_id] = (usageCounts[u.establishment_id] || 0) + 1;
      }
      console.log('[admin/partners] STEP 4 OK — utilisations comptées');
    }
  }

  // ── Fusionner et retourner ────────────────────────────────────
  const result = finalPartners.map(p => {
    const ext = extendedMap[p.id] || {};
    return {
      id:                   p.id,
      name:                 p.name,
      slug:                 p.slug                   || null,
      category:             p.category               || null,
      address:              p.address                || null,
      phone:                ext.phone                || null,
      website:              ext.website              || null,
      photo_url:            ext.photo_url            || null,
      image_url:            ext.image_url            || null,
      is_active:            ext.is_active            !== undefined ? ext.is_active : true,
      affluence_status:     ext.affluence_status     || null,
      offer_decouverte:     ext.offer_decouverte     || null,
      offer_permanente:     ext.offer_permanente     || null,
      discount_decouverte:  ext.discount_decouverte  ?? null,
      discount_permanente:  ext.discount_permanente  ?? null,
      created_at:           ext.created_at           || null,
      offer_count:          offerCounts[p.id]        || 0,
      usage_count:          usageCounts[p.id]        || 0,
    };
  });

  console.log(`[admin/partners] DONE — retour ${result.length} partenaires`);

  return NextResponse.json({
    partners: result,
    total:    count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
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

    console.log('[admin/partners POST] Création partenaire :', payload.name);

    const { data, error } = await supabaseAdmin
      .from('partners')
      .insert(payload)
      .select('id, name')
      .single();

    if (error) {
      console.error('[admin/partners POST] Erreur insert :', error.code, error.message, error.hint);
      // Si is_active n'existe pas encore, réessayer sans is_active
      if (error.code === '42703') {
        console.warn('[admin/partners POST] Colonne manquante détectée, retry sans is_active');
        delete payload.is_active;
        const { data: data2, error: error2 } = await supabaseAdmin
          .from('partners')
          .insert(payload)
          .select('id, name')
          .single();
        if (error2) {
          console.error('[admin/partners POST] Retry failed :', error2.message);
          return NextResponse.json({ error: error2.message }, { status: 500 });
        }
        return NextResponse.json({ partner: data2 }, { status: 201 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ partner: data }, { status: 201 });
  } catch (err) {
    console.error('[admin/partners POST]', err.message);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
