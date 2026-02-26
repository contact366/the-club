"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PERIODS = [
  { value: '1m', label: 'Ce mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' },
  { value: 'all', label: 'Tout' },
];

const AFFLUENCE_OPTIONS = [
  { value: 'calme', label: 'Calme', emoji: '🟢', color: 'bg-green-50 border-green-300 text-green-700' },
  { value: 'modere', label: 'Modéré', emoji: '🟡', color: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { value: 'plein', label: 'Plein', emoji: '🔴', color: 'bg-red-50 border-red-300 text-red-700' },
];

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 800;
    const steps = 40;
    const increment = value / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else { setDisplay(Math.round(start * 100) / 100); }
    }, interval);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{typeof value === 'number' && value % 1 !== 0
        ? display.toFixed(2)
        : Math.round(display)}{suffix}
    </span>
  );
}

export default function EspacePartenaire() {
  const router = useRouter();

  // Auth states
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isPartner, setIsPartner] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // Partner data
  const [partner, setPartner] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [affluenceStatus, setAffluenceStatus] = useState('calme');
  const [affluenceLoading, setAffluenceLoading] = useState(false);

  // Stats
  const [period, setPeriod] = useState('1m');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    async function chargerDonnees() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Vérifier que l'utilisateur est bien un partenaire
      const { data: account } = await supabase
        .from('partner_accounts')
        .select('partner_id, role')
        .eq('user_id', user.id)
        .single();

      if (!account) {
        setIsAuthenticated(true);
        setIsPartner(false);
        setLoading(false);
        return;
      }

      setPartnerId(account.partner_id);

      // Récupérer les infos du partenaire
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id, name, address, category, affluence_status, pin, decouverte_offer, permanent_offer')
        .eq('id', account.partner_id)
        .single();

      if (partnerData) {
        setPartner(partnerData);
        setAffluenceStatus(partnerData.affluence_status || 'calme');
      }

      setIsAuthenticated(true);
      setIsPartner(true);
      setLoading(false);
    }

    chargerDonnees();
  }, []);

  // Charger les stats quand le partenaire est authentifié ou quand la période change
  useEffect(() => {
    if (!partnerId) return;
    setStatsLoading(true);
    fetch('/api/partner/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId, period }),
    })
      .then((res) => res.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch((err) => console.error('Erreur chargement stats:', err))
      .finally(() => setStatsLoading(false));
  }, [partnerId, period]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage({ text: '', type: '' });

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthMessage({ text: error.message, type: 'error' });
      setAuthLoading(false);
    } else {
      setAuthMessage({ text: 'Connexion réussie !', type: 'success' });
      setTimeout(() => { window.location.reload(); }, 1500);
    }
  };

  const handleAffluenceUpdate = async (newStatus) => {
    if (!partnerId || newStatus === affluenceStatus) return;
    setAffluenceLoading(true);
    try {
      const res = await fetch('/api/partner/affluence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAffluenceStatus(newStatus);
        setPartner((prev) => prev ? { ...prev, affluence_status: newStatus } : prev);
      }
    } catch (err) {
      console.error('Erreur mise à jour affluence:', err);
    } finally {
      setAffluenceLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ──────────────────────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <p className="text-gray-500 animate-pulse">Chargement de votre espace partenaire...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // FORMULAIRE DE CONNEXION
  // ──────────────────────────────────────────────────────────
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
              <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              Retour à l&apos;accueil
            </Link>
          </div>

          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">THE CLUB</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace Partenaire</h1>
            <p className="text-sm text-gray-500">Connectez-vous pour accéder à votre tableau de bord.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            {authMessage.text && (
              <div className={`p-4 rounded-2xl text-sm mb-6 ${authMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {authMessage.text}
              </div>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-all shadow-sm disabled:opacity-60"
              >
                {authLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // UTILISATEUR AUTHENTIFIÉ MAIS PAS PARTENAIRE
  // ──────────────────────────────────────────────────────────
  if (isPartner === false) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
              <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              Retour à l&apos;accueil
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-10">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-sm text-gray-500 mb-6">Ce compte n&apos;est pas associé à un établissement partenaire.</p>
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-all"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // DASHBOARD PARTENAIRE
  // ──────────────────────────────────────────────────────────

  const currentAffluence = AFFLUENCE_OPTIONS.find((o) => o.value === affluenceStatus) || AFFLUENCE_OPTIONS[0];

  // Top 3 heures
  const topHours = stats
    ? Object.entries(stats.hourlyDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    : [];

  // Répartition offres
  const decouverteCount = stats?.offerTypeDistribution?.decouverte || 0;
  const permanenteCount = stats?.offerTypeDistribution?.permanente || 0;
  const totalOffers = decouverteCount + permanenteCount || 1;

  return (
    <>
      <div className="min-h-screen bg-[#F5F5F7] pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-10 space-y-8">

          {/* Bouton retour */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
              <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              Retour à l&apos;accueil
            </Link>
          </div>

          {/* ── Carte VIP Partenaire ── */}
          <div
            className="relative rounded-3xl overflow-hidden p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}
          >
            {/* Effet néon */}
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(251,191,36,0.4) 0%, transparent 60%)' }} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-1">THE CLUB</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Espace Partenaire</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentAffluence.color}`}>
                  {currentAffluence.emoji} {currentAffluence.label}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-2xl font-bold text-white">{partner?.name || 'Établissement'}</p>
                <p className="text-sm text-gray-400 mt-0.5">{partner?.category || ''}</p>
                {partner?.address && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {partner.address}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Visites totales</p>
                  <p className="text-3xl font-bold">{stats?.visits ?? '—'}</p>
                </div>
                {partner?.pin && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Code PIN</p>
                    <p className="text-xl font-mono font-bold tracking-widest">{partner.pin}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Filtre par période ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Période d&apos;analyse</p>
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                    period === p.value
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── KPIs ── */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Dashboard de Performance</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Visites */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? <span className="text-gray-300 animate-pulse">—</span> : <AnimatedNumber value={stats?.visits || 0} />}
                </p>
                <p className="text-sm text-gray-500 mt-1">Visites</p>
              </div>

              {/* Chiffre d'affaires */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? <span className="text-gray-300 animate-pulse">—</span> : <AnimatedNumber value={stats?.revenue || 0} suffix=" €" />}
                </p>
                <p className="text-sm text-gray-500 mt-1">Chiffre d&apos;affaires</p>
              </div>

              {/* Économies membres */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statsLoading ? <span className="text-gray-300 animate-pulse">—</span> : <AnimatedNumber value={stats?.savings || 0} suffix=" €" />}
                </p>
                <p className="text-sm text-gray-500 mt-1">Économies membres</p>
              </div>
            </div>
          </div>

          {/* ── Gestion de l'Affluence ── */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Gestion de l&apos;Affluence</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
              <p className="text-sm text-gray-500 mb-4">Indiquez le niveau d&apos;affluence actuel de votre établissement. Il sera visible sur la carte The Club.</p>
              <div className="grid grid-cols-3 gap-3">
                {AFFLUENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAffluenceUpdate(option.value)}
                    disabled={affluenceLoading}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
                      affluenceStatus === option.value
                        ? `${option.color} shadow-sm scale-[1.02]`
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    } disabled:opacity-60`}
                  >
                    {affluenceLoading && affluenceStatus !== option.value && (
                      <span className="absolute inset-0 rounded-2xl bg-white/50 flex items-center justify-center">
                        <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    )}
                    <span className="text-2xl">{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Insights Clients ── */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Insights Clients</h2>
            <div className="space-y-4">

              {/* Panier moyen + Taux de retour */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Panier moyen</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsLoading ? <span className="text-gray-300 animate-pulse">—</span> : <AnimatedNumber value={stats?.avgBasket || 0} suffix=" €" />}
                  </p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Taux de retour</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsLoading ? <span className="text-gray-300 animate-pulse">—</span> : <AnimatedNumber value={stats?.returnRate || 0} suffix=" %" />}
                  </p>
                </div>
              </div>

              {/* Répartition par type d'offre */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                <p className="text-sm font-semibold text-gray-900 mb-4">Répartition par type d&apos;offre</p>
                {statsLoading ? (
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-6 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">Découverte</span>
                        <span className="text-gray-500">{decouverteCount} visite{decouverteCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-700"
                          style={{ width: `${(decouverteCount / totalOffers) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">Permanente</span>
                        <span className="text-gray-500">{permanenteCount} visite{permanenteCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all duration-700"
                          style={{ width: `${(permanenteCount / totalOffers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top heures */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6">
                <p className="text-sm font-semibold text-gray-900 mb-4">Top créneaux horaires</p>
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : topHours.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune donnée disponible</p>
                ) : (
                  <div className="space-y-3">
                    {topHours.map(({ hour, count }, index) => {
                      const maxCount = topHours[0]?.count || 1;
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <div key={hour} className="flex items-center gap-3">
                          <span className="text-lg w-6">{medals[index]}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{String(hour).padStart(2, '0')}h – {String(hour + 1).padStart(2, '0')}h</span>
                              <span className="text-gray-500">{count} visite{count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Dernières visites ── */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Dernières visites</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden">
              {statsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : !stats?.recentVisits?.length ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Aucune visite sur cette période.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.recentVisits.map((visit) => (
                    <li key={visit.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">Offre {visit.offer_type}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(visit.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' '}·{' '}
                            {new Date(visit.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {visit.original_amount != null && (
                          <p className="text-sm font-semibold text-gray-900">{parseFloat(visit.original_amount).toFixed(2)} €</p>
                        )}
                        {visit.saved_amount != null && (
                          <p className="text-xs text-green-600">−{parseFloat(visit.saved_amount).toFixed(2)} €</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Informations de l'établissement ── */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">Informations de l&apos;établissement</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 divide-y divide-gray-100">

              {[
                { label: 'Nom', value: partner?.name },
                { label: 'Catégorie', value: partner?.category },
                { label: 'Adresse', value: partner?.address },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="px-6 py-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
                  </div>
                ) : null
              )}

              {partner?.decouverte_offer && (
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Offre découverte</span>
                  <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{partner.decouverte_offer}</span>
                </div>
              )}
              {partner?.permanent_offer && (
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Offre permanente</span>
                  <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{partner.permanent_offer}</span>
                </div>
              )}
              {partner?.pin && (
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Code PIN</span>
                  <span className="font-mono text-lg font-bold text-gray-900 tracking-widest">{partner.pin}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Déconnexion ── */}
          <div className="pt-2 pb-4">
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all"
            >
              Se déconnecter
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
