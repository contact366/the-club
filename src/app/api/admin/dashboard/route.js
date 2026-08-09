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
      // Membres actifs (profils avec abonnement)
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Partenaires actifs
      supabaseAdmin
        .from('partners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Offres actives
      supabaseAdmin
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total utilisations
      supabaseAdmin
        .from('offer_usage')
        .select('id', { count: 'exact', head: true }),

      // Répartition des pass
      supabaseAdmin
        .from('profiles')
        .select('subscription_type'),

      // Activité récente (30 dernières utilisations)
      supabaseAdmin
        .from('offer_usage')
        .select(`
          id,
          created_at,
          offer_type,
          profiles:user_id ( first_name, last_name, email ),
          offers:offer_id ( title, partners:partner_id ( name ) )
        `)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    // 3. Calculer la répartition des pass
    const passRepartition = { aventurier: 0, explorer: 0, celeste: 0, autre: 0 };
    if (repartitionResult.data) {
      for (const profile of repartitionResult.data) {
        const type = (profile.subscription_type || '').toLowerCase();
        if (type === 'aventurier') passRepartition.aventurier++;
        else if (type === 'explorer') passRepartition.explorer++;
        else if (type === 'celeste' || type === 'céleste') passRepartition.celeste++;
        else passRepartition.autre++;
      }
    }

    // 4. Formater l'activité récente
    const activiteRecente = (activiteResult.data || []).map((item) => ({
      id: item.id,
      date: item.created_at,
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
