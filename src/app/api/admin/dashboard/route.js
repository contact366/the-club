import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  // 1. Authentification + vérification admin
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { supabaseAdmin } = auth;

  try {
    // 2. Récupérer toutes les statistiques en parallèle
    const [
      membresResult,
      partenairesResult,
      offresResult,
      utilisationsResult,
      repartitionResult,
      activiteResult,
    ] = await Promise.all([
      // Membres (tous les profils enregistrés)
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Partenaires (tous — pas de colonne is_active sur cette table)
      supabaseAdmin
        .from('partners')
        .select('id', { count: 'exact', head: true }),

      // Offres actives
      supabaseAdmin
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total utilisations
      supabaseAdmin
        .from('offer_usage')
        .select('id', { count: 'exact', head: true }),

      // Répartition des pass (tous les profils)
      supabaseAdmin
        .from('profiles')
        .select('subscription_type'),

      // Activité récente — offer_usage avec FK offer_uuid → offers.id
      // et user_id → profiles.user_id ; ordre par used_at
      supabaseAdmin
        .from('offer_usage')
        .select(`
          id,
          used_at,
          offer_type,
          profiles:user_id ( first_name, last_name, email ),
          offers:offer_uuid ( title, partner_id, partners:partner_id ( name ) )
        `)
        .order('used_at', { ascending: false })
        .limit(30),
    ]);

    // 3. Calculer la répartition des pass
    // Valeurs attendues : 'aventurier', 'explorer', 'celeste'/'céleste'
    // null / '' / 'none' / autre → "Sans abonnement"
    const passRepartition = { aventurier: 0, explorer: 0, celeste: 0, sans_abonnement: 0 };
    if (repartitionResult.data) {
      for (const profile of repartitionResult.data) {
        const raw = profile.subscription_type;
        const type = (raw || '').toLowerCase().trim();
        if (type === 'aventurier') passRepartition.aventurier++;
        else if (type === 'explorer') passRepartition.explorer++;
        else if (type === 'celeste' || type === 'céleste') passRepartition.celeste++;
        else passRepartition.sans_abonnement++;
      }
    }

    // 4. Formater l'activité récente
    const activiteRecente = (activiteResult.data || []).map((item) => ({
      id: item.id,
      date: item.used_at,
      offerType: item.offer_type,
      membre: item.profiles
        ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() ||
          item.profiles.email ||
          'Inconnu'
        : 'Inconnu',
      offre: item.offers?.title || 'Offre inconnue',
      partenaire: item.offers?.partners?.name || 'Partenaire inconnu',
    }));

    return NextResponse.json({
      stats: {
        membresActifs: membresResult.count ?? 0,
        partenairesActifs: partenairesResult.count ?? 0,
        offresActives: offresResult.count ?? 0,
        totalUtilisations: utilisationsResult.count ?? 0,
      },
      passRepartition,
      activiteRecente,
    });
  } catch (err) {
    console.error('[admin/dashboard] Erreur:', err.message);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
