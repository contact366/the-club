"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export default function EspaceMembre() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [profil, setProfil] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // 🌟 NOUVEAUX ÉTATS POUR LES FONCTIONNALITÉS PREMIUM
  const [userEmail, setUserEmail] = useState('');
  const [userFirstName, setUserFirstName] = useState(''); // Nouveau : prénom de l'utilisateur
  const [offresUtiliseesMois, setOffresUtiliseesMois] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [favoris, setFavoris] = useState([]);

  // États pour le formulaire d'authentification
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function chargerDonnees() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      const { data: dataProfil } = await supabase
        .from('profiles')
        .select('subscription_type, montant_economise, first_name, stripe_customer_id, avatar_url, expires_at')
        .eq('id', user.id)
        .single();

      if (dataProfil) {
        setProfil({ ...dataProfil, created_at: user.created_at });
        // On récupère le prénom depuis la BDD
        setUserFirstName(dataProfil.first_name || userEmail.split('@')[0]);
        if (dataProfil.avatar_url) setAvatarUrl(dataProfil.avatar_url);
      }

      // 🌟 NOUVEAU : Calcul des offres utilisées ce mois-ci
      const debutDuMois = new Date();
      debutDuMois.setDate(1);
      debutDuMois.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('utilisations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('offer_type', 'decouverte')
        .gte('created_at', debutDuMois.toISOString());

      if (count !== null) setOffresUtiliseesMois(count);

      // Historique complet
      const { data: dataHistorique } = await supabase
        .from('utilisations')
        .select(`*, partners ( name )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dataHistorique) setHistorique(dataHistorique);

      // Charger les favoris avec les infos partenaires
      const { data: dataFavoris } = await supabase
        .from('favorites')
        .select('*, partners(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dataFavoris) setFavoris(dataFavoris);

      setIsAuthenticated(true);
      setLoading(false);
    }

    chargerDonnees();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage({ text: '', type: '' });

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { first_name: authFirstName } },
      });
      setAuthMessage(error
        ? { text: error.message, type: 'error' }
        : { text: "Compte créé ! Vérifiez votre boîte mail (et vos spams) pour confirmer votre inscription. 📩", type: 'success' }
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) {
        setAuthMessage({ text: error.message, type: 'error' });
      } else {
        setAuthMessage({ text: 'Connexion réussie !', type: 'success' });
        setTimeout(() => { window.location.reload(); }, 1500);
      }
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!profil?.expires_at || profil?.subscription_type !== 'aventurier') return;

    const updateCountdown = () => {
      const now = new Date();
      const expires = new Date(profil.expires_at);
      const diff = expires - now;

      if (diff <= 0) {
        setCountdown({ expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profil]);

  // Fonction pour rediriger vers Stripe Customer Portal
  const handleGererAbonnement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Impossible d'ouvrir le portail : " + data.error);
      }
    } catch (error) {
      alert("Erreur de connexion au serveur.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type et la taille
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!allowedExts.includes(fileExt)) {
        alert("Format d'image non supporté. Utilisez JPG, PNG, GIF ou WEBP.");
        return;
      }
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload dans Supabase Storage (bucket "avatars")
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour le profil dans la base
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Erreur upload avatar:", error.message);
      alert("Erreur lors de l'upload de la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Erreur : utilisateur non connecté.");
        return;
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Déconnexion locale puis redirection
        await supabase.auth.signOut();
        router.push('/');
      } else {
        alert("Erreur lors de la suppression : " + (data.error || "Erreur inconnue"));
      }
    } catch (error) {
      alert("Erreur de connexion au serveur.");
      console.error("Erreur suppression compte:", error.message);
    } finally {
      setDeleting(false);
    }
  };

  const removeFavori = async (favoriteId) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (!error) setFavoris(prev => prev.filter(f => f.id !== favoriteId));
    } catch (err) {
      console.error('Erreur suppression favori:', err.message);
    }
  };

  const handlePartagerFavoris = async () => {
    const nomsPartenaires = favoris.map(f => f.partners?.name).filter(Boolean);
    const textePartage = `🌴 Mes coups de cœur sur The Club :\n\n${nomsPartenaires.map(n => `❤️ ${n}`).join('\n')}\n\nDécouvrez ces adresses exclusives sur The Club !`;
    const urlPartage = typeof window !== 'undefined' ? window.location.origin : 'https://theclub-app.fr';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mes coups de cœur — The Club',
          text: textePartage,
          url: urlPartage,
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Erreur partage:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${textePartage}\n\n${urlPartage}`);
        alert('Liste copiée dans le presse-papiers ! 📋');
      } catch {
        prompt('Copiez ce texte pour partager vos coups de cœur :', `${textePartage}\n\n${urlPartage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <p className="text-gray-500 animate-pulse">Chargement de votre espace VIP...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Retour à l'accueil */}
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

          {/* Logo & titre */}
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">THE CLUB</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accédez à votre espace membre</h1>
            <p className="text-sm text-gray-500">Connectez-vous ou créez un compte pour profiter de vos avantages exclusifs.</p>
          </div>

          {/* Carte du formulaire */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            {authMessage.text && (
              <div className={`p-4 rounded-2xl text-sm mb-6 ${authMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {authMessage.text}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Prénom</label>
                  <input
                    type="text"
                    value={authFirstName}
                    onChange={(e) => setAuthFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    required
                    autoComplete="given-name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
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
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Chargement...
                  </span>
                ) : authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage({ text: '', type: '' }); }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {authMode === 'login' ? "Pas encore membre ? Créer un compte" : "Déjà membre ? Se connecter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const planName = profil?.subscription_type?.toLowerCase() || '';
  const isCercle = planName.includes('cercle');
  const isCeleste = planName.includes('celeste') || planName.includes('céleste');

  const isAventurier = planName.includes('aventurier');

  let neonThemeClass = 'theme-explorer';
  if (isCercle) neonThemeClass = 'theme-cercle';
  else if (isCeleste) neonThemeClass = 'theme-celeste';
  else if (isAventurier) neonThemeClass = 'theme-aventurier';

  return (
    <>
    <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-12">
      
      {/* CSS DE L'EFFET NÉON (Inchangé) */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-celeste { --neon-color-head: #ffffff; --neon-color-tail: #EAB308; }
        .theme-explorer { --neon-color-head: #ffffff; --neon-color-tail: #3B82F6; }
        .theme-cercle { --neon-color-head: #ffffff; --neon-color-tail: #94a3b8; }
        .theme-aventurier { --neon-color-head: #ffffff; --neon-color-tail: #F97316; }
        .bg-carbon {
          background-color: #0a0a0a;
          background-image: linear-gradient(45deg, #111 25%, transparent 25%),
                            linear-gradient(-45deg, #111 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #111 75%),
                            linear-gradient(-45deg, transparent 75%, #111 75%);
          background-size: 4px 4px;
        }
        .neon-rotating-container { position: relative; border-radius: 9999px; padding: 2px; overflow: hidden; display: inline-block; }
        .neon-rotating-container::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent 0deg, transparent 260deg, var(--neon-color-tail) 320deg, var(--neon-color-head) 360deg);
          animation: rotate-border 3s linear infinite; z-index: 0;
          border-radius: 9999px;
        }
        .neon-rotating-container::after { content: ''; position: absolute; inset: 2px; background: #0a0a0a; border-radius: 9999px; z-index: 1; }
        @keyframes rotate-border { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* BOUTON RETOUR */}
        <div className="pt-2">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Retour à l'accueil
          </Link>
        </div>

        {/* 🌟 EN-TÊTE DU PROFIL + WIDGET MÉTÉO COMBINÉS */}
        <div className="space-y-4">
          {/* En-tête avec le prénom */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonjour, {userFirstName}</h1>
            <p className="text-gray-500 mt-2">Prêt pour votre prochaine sortie ?</p>
          </div>

          {/* Widget météo */}
          <div>
            <WeatherWidget />
          </div>
        </div>

        {/* CONTENEUR PRINCIPAL OPTIMISÉ POUR MOBILE */}
        <div className="flex flex-col gap-4 md:gap-6">

          {/* 1. BLOC IDENTITÉ & DÉCONNEXION (Simplifié : sans le bonjour en double) */}
          <div className="flex items-center justify-between bg-white/50 p-3 rounded-2xl border border-gray-200/50">
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer group shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-inner group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-gray-200 to-gray-100 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold shadow-inner border border-white">
                    {userFirstName.charAt(0).toUpperCase()}
                  </div>
                )}
                {uploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </label>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium">Membre</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 truncate">
                  {userFirstName}
                </h2>
              </div>
            </div>
            {/* Bouton engrenage → Stripe Portal */}
            {profil?.stripe_customer_id && (
            <button
              onClick={handleGererAbonnement}
              className="p-2.5 bg-white text-gray-600 rounded-full shadow-sm border border-gray-200/60 hover:scale-105 active:scale-95 transition-all"
              title="Gérer mon abonnement"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            )}
          </div>

          {/* 2. LA CARTE VIP */}
          <div className={`relative ${isCercle ? 'bg-carbon border border-white/20' : 'bg-[#0A0A0A]'} rounded-3xl p-6 md:p-8 text-white shadow-xl overflow-hidden min-h-[140px] flex items-center`}>
            {/* Reflet argenté exclusif au Cercle */}
            {isCercle && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-0"></div>}

            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between w-full items-start md:items-center gap-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Statut du membre</p>
                <div className={`neon-rotating-container inline-block ${neonThemeClass}`}>
                  <div className="relative z-10 flex items-center gap-3 px-5 py-2 rounded-full">
                    <span className={`text-xl font-bold tracking-tight capitalize ${isCercle ? 'text-slate-300' : isCeleste ? 'text-yellow-400' : 'text-blue-400'}`}>
                      Pass {profil?.subscription_type || 'Aucun'}
                    </span>
                    <span className="flex w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                  </div>
                </div>
                {profil?.subscription_type === 'aventurier' && countdown && !countdown.expired && countdown.hours !== undefined && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Expire dans</span>
                    <div className="flex gap-1">
                      <span className="bg-white/10 px-2 py-1 rounded text-white font-mono text-sm">{String(countdown.hours).padStart(2, '0')}h</span>
                      <span className="text-gray-500">:</span>
                      <span className="bg-white/10 px-2 py-1 rounded text-white font-mono text-sm">{String(countdown.minutes).padStart(2, '0')}m</span>
                      <span className="text-gray-500">:</span>
                      <span className="bg-white/10 px-2 py-1 rounded text-white font-mono text-sm">{String(countdown.seconds).padStart(2, '0')}s</span>
                    </div>
                  </div>
                )}
                {profil?.subscription_type === 'aventurier' && countdown?.expired && (
                  <p className="mt-4 text-red-400 text-sm font-semibold">⏰ Votre pass a expiré</p>
                )}
              </div>

              <div className="relative h-20 w-full md:w-64 overflow-hidden">
                <div className={`absolute right-0 top-0 w-full text-left md:text-right transition-all duration-700 ease-in-out transform ${activeSlide === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">Total Économisé</p>
                  <p className="text-4xl md:text-5xl font-light tracking-tighter text-white">
                    {profil?.montant_economise ?? '0.00'}<span className="text-xl md:text-2xl text-gray-400 ml-1">€</span>
                  </p>
                </div>
                <div className={`absolute right-0 top-0 w-full text-left md:text-right transition-all duration-700 ease-in-out transform ${activeSlide === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">Membre depuis</p>
                  <p className="text-3xl font-light tracking-tight text-white mt-2">
                    {profil?.created_at ? new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Récemment'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MENU D'ACTIONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="flex items-center justify-center gap-2 p-3 bg-white rounded-2xl text-sm font-semibold text-red-500 border border-gray-200 shadow-sm active:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
            <Link
              href="/devenir-partenaire"
              className="flex items-center justify-center gap-2 p-3 bg-white rounded-2xl text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm active:bg-gray-50 text-center transition-colors"
            >
              Devenir Partenaire
            </Link>
          </div>

          {/* Bouton Supprimer mon compte */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-white rounded-2xl text-xs font-medium text-gray-400 border border-gray-100 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer mon compte
          </button>

        </div>

        {/* 🌟 NOUVEAU : LA JAUGE DES OFFRES */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Offres Découverte du mois</h3>
            <p className="text-sm text-gray-500">
              {isCercle ? "Accès illimité et prioritaire — Pass Le Cercle." : isCeleste ? "Votre pass vous donne un accès illimité." : "Passez Céleste pour débloquer l'illimité."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isCercle || isCeleste ? (
              // Affichage Céleste : Infini
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${isCercle ? 'text-slate-500 bg-slate-100' : 'text-yellow-500 bg-yellow-50'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Illimité
              </div>
            ) : (
              // Affichage Explorer : Jauge 3 pastilles
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <div 
                      key={num} 
                      className={`w-8 h-2.5 rounded-full transition-colors ${
                        offresUtiliseesMois >= num ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {offresUtiliseesMois} / 3 utilisées
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ❤️ MES COUPS DE CŒUR */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Mes coups de cœur</h2>
            {favoris.length > 0 && (
              <button
                onClick={handlePartagerFavoris}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden">
            {favoris.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤍</span>
                </div>
                <p className="text-gray-500 text-lg">Aucun coup de cœur pour le moment.</p>
                <p className="text-gray-400 text-sm mt-1">Explorez la carte et ajoutez vos adresses préférées !</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {favoris.map((fav) => (
                  <li key={fav.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        <span className="text-lg">❤️</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{fav.partners?.name || 'Établissement'}</p>
                        <p className="text-sm text-gray-500">{fav.partners?.category || ''}{fav.partners?.address ? ` • ${fav.partners.address}` : ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavori(fav.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      title="Retirer des favoris"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* L'HISTORIQUE (Inchangé) */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Activité récente</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden">
            {historique.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">Aucune offre utilisée pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {historique.map((item) => (
                  <li key={item.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{item.partners?.name || 'Établissement inconnu'}</p>
                        <p className="text-sm text-gray-500 capitalize">Offre {item.offer_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>

      {/* MODALE DE SUPPRESSION DE COMPTE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer votre compte ?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Cette action est <strong className="text-red-500">irréversible</strong>. Toutes vos données seront définitivement supprimées :
              </p>
              <ul className="text-xs text-gray-400 mt-3 space-y-1 text-left max-w-xs mx-auto">
                <li>• Votre profil et vos informations personnelles</li>
                <li>• Votre historique d&apos;économies et d&apos;utilisations</li>
                <li>• Votre abonnement Stripe sera annulé</li>
                <li>• Votre photo de profil</li>
              </ul>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-bold text-red-500">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleting}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  deleteConfirmText === 'SUPPRIMER' && !deleting
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Suppression...
                  </span>
                ) : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}