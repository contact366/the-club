import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { partnerId, period } = await req.json();

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId est requis' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculer la date de début selon la période
    let startDate = null;
    if (period && period !== 'all') {
      const months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
      const monthCount = months[period];
      if (monthCount) {
        const date = new Date();
        date.setMonth(date.getMonth() - monthCount);
        startDate = date.toISOString();
      }
    }

    // Construire la requête de base
    let query = supabaseAdmin
      .from('utilisations')
      .select('id, user_id, offer_type, original_amount, saved_amount, created_at')
      .eq('partner_id', partnerId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    const { data: utilisations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération stats:', error.message);
      return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques.' }, { status: 500 });
    }

    const data = utilisations || [];

    // Nombre total de visites
    const visits = data.length;

    // Chiffre d'affaires (somme des original_amount)
    const revenue = data.reduce((sum, u) => sum + (parseFloat(u.original_amount) || 0), 0);

    // Économies réalisées (somme des saved_amount)
    const savings = data.reduce((sum, u) => sum + (parseFloat(u.saved_amount) || 0), 0);

    // Panier moyen
    const avgBasket = visits > 0 ? revenue / visits : 0;

    // Taux de retour : % de user_id avec plus d'une visite
    const visitsByUser = {};
    data.forEach((u) => {
      visitsByUser[u.user_id] = (visitsByUser[u.user_id] || 0) + 1;
    });
    const uniqueUsers = Object.keys(visitsByUser).length;
    const returningUsers = Object.values(visitsByUser).filter((count) => count > 1).length;
    const returnRate = uniqueUsers > 0 ? Math.round((returningUsers / uniqueUsers) * 100) : 0;

    // Répartition par type d'offre
    const offerTypeDistribution = {};
    data.forEach((u) => {
      const type = u.offer_type || 'inconnu';
      offerTypeDistribution[type] = (offerTypeDistribution[type] || 0) + 1;
    });

    // Répartition horaire (top heures)
    const hourlyDistribution = {};
    data.forEach((u) => {
      const hour = new Date(u.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // 10 dernières visites
    const recentVisits = data.slice(0, 10).map((u) => ({
      id: u.id,
      created_at: u.created_at,
      offer_type: u.offer_type,
      original_amount: u.original_amount,
      saved_amount: u.saved_amount,
    }));

    return NextResponse.json({
      visits,
      revenue: Math.round(revenue * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      avgBasket: Math.round(avgBasket * 100) / 100,
      returnRate,
      offerTypeDistribution,
      hourlyDistribution,
      recentVisits,
    });
  } catch (error) {
    console.error('Erreur API stats partenaire:', error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
