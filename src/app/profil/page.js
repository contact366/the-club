"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import Emoji from '@/components/Emoji';
import { getImageSrc, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

// Configuration des badges par type (emoji, couleur Tailwind)
const BADGE_CONFIG = {
  explorer: { emoji: '🗺️', label: 'explorer', color: 'bg-blue-500' },
  gourmet: { emoji: '🍽️', label: 'gourmet', color: 'bg-amber-500' },
  wellness: { emoji: '🧘', label: 'wellness', color: 'bg-teal-500' },
  gold: { emoji: '👑', label: 'gold', color: 'bg-yellow-500' },
};

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
  const [removingFavIds, setRemovingFavIds] = useState(new Set());

  // États pour les badges et récompenses
  const [badgesData, setBadgesData] = useState([]);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');

  // États pour la section "Mes informations"
  const [newEmail, setNewEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [infoMessage, setInfoMessage] = useState({ text: '', type: '' });

  // États pour le formulaire d'authentification
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authGender, setAuthGender] = useState('');
  const [authBirthDate, setAuthBirthDate] = useState('');
  const [authNewsletter, setAuthNewsletter] = useState(false);
  const [authSmsAlerts, setAuthSmsAlerts] = useState(false);
  const [authCgu, setAuthCgu] = useState(false);
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
        .select('subscription_type, montant_economise, first_name, stripe_customer_id, avatar_url, expires_at, referral_code, referral_count, phone')
        .eq('id', user.id)
        .single();

      if (dataProfil) {
        setProfil({ ...dataProfil, created_at: user.created_at });
        // On récupère le prénom depuis la BDD
        setUserFirstName(dataProfil.first_name || userEmail.split('@')[0]);
        if (dataProfil.avatar_url) setAvatarUrl(dataProfil.avatar_url);
        if (dataProfil.phone) setNewPhone(dataProfil.phone);
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

      // Charger les badges actifs et la progression de l'utilisateur
      const { data: dataBadges } = await supabase
        .from('badges')
        .select('id, code, title, badge_type, required_count, plan_required')
        .eq('is_active', true);

      const { data: dataProgress } = await supabase
        .from('user_badges_progress')
        .select('badge_id, current_count, is_unlocked, unlocked_at')
        .eq('user_id', user.id);

      if (dataBadges) {
        const progressMap = {};
        if (dataProgress) {
          dataProgress.forEach((p) => { progressMap[p.badge_id] = p; });
        }
        const merged = dataBadges.map((badge) => {
          const prog = progressMap[badge.id] || {};
          return {
            id: badge.id,
            code: badge.code,
            title: badge.title,
            badge_type: badge.badge_type,
            required_count: badge.required_count,
            plan_required: badge.plan_required,
            current_count: prog.current_count ?? 0,
            is_unlocked: prog.is_unlocked ?? false,
            unlocked_at: prog.unlocked_at ?? null,
          };
        });
        setBadgesData(merged);
      }

      setIsAuthenticated(true);
      setLoading(false);
    }

    chargerDonnees();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthMessage({ text: '', type: '' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthMessage({ text: error.message, type: 'error' });
      setAuthLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage({ text: '', type: '' });

    if (authMode === 'signup') {
      if (!authCgu) {
        setAuthMessage({ text: 'Vous devez accepter les conditions générales d\'utilisation.', type: 'error' });
        setAuthLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            first_name: authFirstName,
            last_name: authLastName,
            phone: authPhone,
            gender: authGender,
            birth_date: authBirthDate,
            newsletter: authNewsletter,
            sms_alerts: authSmsAlerts,
            cgu_accepted: true,
            cgu_accepted_at: new Date().toISOString(),
          },
        },
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

  // Réclamer automatiquement la récompense si le badge riviera_explorer est débloqué
  useEffect(() => {
    if (rewardClaimed) return;
    const explorerBadge = badgesData.find((b) => b.code === 'riviera_explorer' && b.is_unlocked);
    if (!explorerBadge) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      fetch('/api/badges/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, badgeCode: 'riviera_explorer' }),
      })
        .then((res) => res.json())
        .then((data) => {
          setRewardClaimed(true);
          if (data.success && !data.alreadyClaimed && data.message) {
            setRewardMessage(data.message);
            setTimeout(() => setRewardMessage(''), 5000);
          }
        })
        .catch((err) => console.error('Erreur réclamation récompense badge:', err.message));
    });
  }, [badgesData, rewardClaimed]);

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

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    setInfoMessage({ text: '', type: '' });
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setInfoMessage({ text: error.message, type: 'error' });
    } else {
      setInfoMessage({ text: 'Un email de confirmation a été envoyé à votre nouvelle adresse.', type: 'success' });
      setEditingEmail(false);
      setNewEmail('');
    }
  };

  const handleUpdatePhone = async () => {
    setSavingPhone(true);
    setInfoMessage({ text: '', type: '' });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('profiles').update({ phone: newPhone }).eq('id', user.id);
      if (error) {
        setInfoMessage({ text: error.message, type: 'error' });
      } else {
        setInfoMessage({ text: 'Téléphone mis à jour avec succès.', type: 'success' });
      }
    } catch (err) {
      setInfoMessage({ text: 'Erreur lors de la mise à jour.', type: 'error' });
    } finally {
      setSavingPhone(false);
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
    setRemovingFavIds(prev => new Set([...prev, favoriteId]));
    await new Promise(r => setTimeout(r, 350));
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (!error) setFavoris(prev => prev.filter(f => f.id !== favoriteId));
    } catch (err) {
      console.error('Erreur suppression favori:', err.message);
    } finally {
      setRemovingFavIds(prev => { const next = new Set(prev); next.delete(favoriteId); return next; });
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

  // Réclamer la récompense d'un badge débloqué via l'API
  const handleClaimReward = async (userId, badgeCode) => {
    if (rewardClaimed) return;
    try {
      const response = await fetch('/api/badges/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeCode }),
      });
      const data = await response.json();
      setRewardClaimed(true);
      if (data.success && !data.alreadyClaimed && data.message) {
        setRewardMessage(data.message);
        setTimeout(() => setRewardMessage(''), 5000);
      }
    } catch (err) {
      console.error('Erreur réclamation récompense badge:', err.message);
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

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:shadow-md hover:bg-gray-50 transition-all disabled:opacity-50 focus:outline-none"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Se connecter avec Google
                </button>
                <div className="flex items-center my-4 gap-3">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">ou</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Prénom *</label>
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
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nom *</label>
                      <input
                        type="text"
                        value={authLastName}
                        onChange={(e) => setAuthLastName(e.target.value)}
                        placeholder="Votre nom"
                        required
                        autoComplete="family-name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">N° de téléphone</label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      autoComplete="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Genre</label>
                      <select
                        value={authGender}
                        onChange={(e) => setAuthGender(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                      >
                        <option value="">Choisir</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                        <option value="autre">Autre</option>
                        <option value="non_precise">Ne pas préciser</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Date de naissance *</label>
                      <input
                        type="date"
                        value={authBirthDate}
                        onChange={(e) => setAuthBirthDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
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
              {authMode === 'signup' && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authNewsletter}
                      onChange={(e) => setAuthNewsletter(e.target.checked)}
                      className="mt-0.5 rounded"
                    />
                    <span className="text-xs text-gray-600">Restez informés de nos nouvelles offres, inscrivez-vous à la newsletter</span>
                  </label>
                  <label className={`flex items-start gap-3 ${!authPhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={authSmsAlerts}
                      onChange={(e) => setAuthSmsAlerts(e.target.checked)}
                      disabled={!authPhone}
                      className="mt-0.5 rounded"
                    />
                    <span className="text-xs text-gray-600">S&apos;inscrire aux alertes SMS</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authCgu}
                      onChange={(e) => setAuthCgu(e.target.checked)}
                      required
                      className="mt-0.5 rounded"
                    />
                    <span className="text-xs text-gray-600">J&apos;accepte les <span className="font-semibold text-gray-900">conditions générales d&apos;utilisation</span> *</span>
                  </label>
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading || (authMode === 'signup' && !authCgu)}
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
    <div className="min-h-screen bg-riviera-sand">

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
        @keyframes badge-unlock {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(234,179,8,0.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        .badge-unlocked { animation: badge-unlock 0.6s ease-out; }
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: var(--progress-width); }
        }
        .progress-bar-animated { animation: progress-fill 1s ease-out forwards; }
        .dashboard-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .dashboard-card:hover { box-shadow: 0 8px 30px rgba(15,23,42,0.10); transform: translateY(-1px); }
        @keyframes section-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-animate { animation: section-fade-in 0.5s ease-out both; }
      `}} />

      <div className="max-w-2xl mx-auto px-5 pb-24">

        {/* BOUTON RETOUR */}
        <div className="pt-6 pb-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-riviera-navy transition-colors group">
            <div className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* ── 1. HEADER ── */}
        <div className="pt-4 pb-6 flex items-start justify-between gap-4 section-animate">
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-sm mb-1">Prêt pour votre prochaine sortie ?</p>
            <h1 className="text-3xl font-bold text-riviera-navy leading-tight">Bonjour, {userFirstName} 👋</h1>
          </div>

          {/* Avatar cliquable pour upload */}
          <label className="relative cursor-pointer group shrink-0 mt-1">
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-riviera-gold to-amber-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </label>
        </div>

        {/* Widget météo */}
        <div className="mb-6 section-animate" style={{ animationDelay: '0.05s' }}>
          <WeatherWidget />
        </div>

        {/* ── 2. MEMBERSHIP HERO CARD ── */}
        <div
          className={`relative rounded-[24px] overflow-hidden mb-6 shadow-2xl section-animate ${isCercle ? 'bg-carbon border border-white/20' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          {/* Dark navy gradient background */}
          {!isCercle && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a2744] to-[#0F172A]" />
          )}
          {isCercle && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-0" />}
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-riviera-gold/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-riviera-azure/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 p-7">
            {/* Top row: pass badge + settings */}
            <div className="flex items-start justify-between mb-7">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Statut du membre</p>
                <div className={`neon-rotating-container inline-block ${neonThemeClass}`}>
                  <div className="relative z-10 flex items-center gap-2 px-5 py-2 rounded-full">
                    <span className={`text-base font-bold tracking-tight capitalize ${isCercle ? 'text-slate-300' : isCeleste ? 'text-yellow-400' : 'text-blue-400'}`}>
                      Pass {profil?.subscription_type || 'Aucun'}
                    </span>
                    <span className="flex w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
              </div>
              {profil?.stripe_customer_id && (
                <button
                  onClick={handleGererAbonnement}
                  className="p-2 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                  title="Gérer mon abonnement"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Savings highlight */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Total économisé</p>
              <p className="text-5xl font-light tracking-tighter text-white">
                {profil?.montant_economise ?? '0.00'}<span className="text-2xl text-gray-400 ml-1">€</span>
              </p>
            </div>

            {/* Bottom row: discoveries + member since */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5">
                {isCercle || isCeleste ? (
                  <p className="text-white text-sm font-medium">
                    <span className={`${isCeleste ? 'text-yellow-400' : 'text-slate-300'} mr-1`}>✦</span>
                    Découvertes illimitées
                  </p>
                ) : (
                  <p className="text-white text-sm font-medium">
                    Découvertes restantes ce mois :&nbsp;
                    <span className="font-bold text-riviera-gold">{Math.max(0, 3 - offresUtiliseesMois)}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Membre depuis</p>
                <p className="text-sm text-gray-300 font-medium">
                  {profil?.created_at ? new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Récemment'}
                </p>
              </div>
            </div>

            {/* Countdown pour Aventurier */}
            {profil?.subscription_type === 'aventurier' && countdown && !countdown.expired && countdown.hours !== undefined && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
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
              <p className="mt-5 text-red-400 text-sm font-semibold"><Emoji symbol="⏰" label="expiré" size={16} /> Votre pass a expiré</p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3 mb-8 section-animate" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-[18px] text-sm font-semibold text-red-500 border border-gray-100 shadow-sm hover:shadow active:scale-95 transition-all"
          >
            Déconnexion
          </button>
          <Link
            href="/espace-partenaire"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-[18px] text-sm font-semibold text-riviera-navy border border-gray-100 shadow-sm hover:shadow active:scale-95 text-center transition-all"
          >
            Espace Partenaire
          </Link>
        </div>

        {/* ── 3. À DÉCOUVRIR AUJOURD'HUI ── */}
        <div className="mb-8 section-animate" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-riviera-navy mb-4">À découvrir aujourd&apos;hui</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🍽️', label: 'Restaurants', colorFrom: '#FFF8EE', colorTo: '#FFF0D6', accent: '#B45309', border: '#FDE68A' },
              { icon: '🏄', label: 'Activités', colorFrom: '#EFF6FF', colorTo: '#DBEAFE', accent: '#1D4ED8', border: '#BFDBFE' },
              { icon: '🧘', label: 'Bien-être', colorFrom: '#F0FDF4', colorTo: '#DCFCE7', accent: '#047857', border: '#A7F3D0' },
            ].map(({ icon, label, colorFrom, colorTo, accent, border }) => (
              <Link
                key={label}
                href="/carte"
                className="dashboard-card rounded-[20px] p-4 flex flex-col items-center gap-2.5 border text-center active:scale-95 transition-all"
                style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`, borderColor: border }}
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-xs font-semibold leading-tight" style={{ color: accent }}>{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 4. EXPLORATION RIVIERA — Badges ── */}
        {badgesData.filter((b) => b.plan_required === 'all' || (b.plan_required === 'celeste' && isCeleste)).length > 0 && (
          <div className="mb-8 section-animate" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-2xl font-bold text-riviera-navy mb-4">Exploration Riviera</h2>

            {/* Toast récompense */}
            {rewardMessage && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-[18px] text-sm font-medium flex items-center gap-2">
                <Emoji symbol="🎉" label="récompense" size={18} />
                {rewardMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badgesData
                .filter((b) => b.plan_required === 'all' || (b.plan_required === 'celeste' && isCeleste))
                .map((badge) => {
                  const config = BADGE_CONFIG[badge.badge_type] || { emoji: '🏅', label: 'badge', color: 'bg-gray-400' };
                  const progress = Math.min(badge.current_count / badge.required_count, 1);

                  return (
                    <div
                      key={badge.id}
                      className={`bg-white rounded-[20px] border border-gray-100 p-5 flex flex-col gap-4 dashboard-card ${badge.is_unlocked ? 'badge-unlocked' : 'opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${badge.is_unlocked ? config.color : 'bg-gray-100'}`}>
                          {badge.is_unlocked
                            ? <Emoji symbol={config.emoji} label={config.label} size={24} />
                            : <Emoji symbol="🔒" label="verrouillé" size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-riviera-navy">{badge.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{badge.current_count} / {badge.required_count} complétés</p>
                        </div>
                      </div>
                      {/* Larger progress bar */}
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 progress-bar-animated ${badge.is_unlocked ? config.color : 'bg-gray-300'}`}
                          style={{ width: `${progress * 100}%`, '--progress-width': `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── 5. MES COUPS DE CŒUR ── */}
        <div className="mb-8 section-animate" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-riviera-navy">Mes coups de cœur</h2>
            {favoris.length > 0 && (
              <button
                onClick={handlePartagerFavoris}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs font-semibold shadow hover:shadow-md active:scale-95 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager
              </button>
            )}
          </div>

          {favoris.length === 0 ? (
            <div className="bg-white rounded-[20px] p-10 text-center border border-gray-100">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Emoji symbol="🤍" label="aucun favori" size={32} />
              </div>
              <p className="text-gray-500 font-medium">Aucun coup de cœur pour le moment.</p>
              <p className="text-gray-400 text-sm mt-1">Explorez la carte et ajoutez vos adresses préférées !</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favoris.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white rounded-[20px] overflow-hidden border border-gray-100 dashboard-card"
                  style={{ opacity: removingFavIds.has(fav.id) ? 0 : 1, transition: 'opacity 350ms ease, box-shadow 0.2s ease, transform 0.2s ease' }}
                >
                  {/* Image */}
                  <div className="h-28 overflow-hidden bg-gray-100 relative">
                    <img
                      src={getImageSrc(fav.partners?.photo_url)}
                      alt={fav.partners?.name || 'Établissement'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-bold text-riviera-navy text-sm truncate leading-snug">{fav.partners?.name || 'Établissement'}</p>
                    {fav.partners?.category && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{fav.partners.category}</p>
                    )}
                    {fav.partners?.address && (
                      <p className="text-xs text-gray-400 truncate">{fav.partners.address}</p>
                    )}
                    <button
                      onClick={() => removeFavori(fav.id)}
                      className="mt-2 text-xs text-gray-300 hover:text-red-400 transition-colors"
                      title="Retirer des favoris"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 6. ACTIVITÉ RÉCENTE ── */}
        <div className="mb-8 section-animate" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-2xl font-bold text-riviera-navy mb-4">Activité récente</h2>

          {historique.length === 0 ? (
            <div className="bg-white rounded-[20px] p-10 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Aucune offre utilisée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historique.slice(0, 4).map((item) => (
                <div key={item.id} className="bg-white rounded-[20px] p-4 flex items-center gap-4 border border-gray-100 dashboard-card">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-riviera-navy truncate">{item.partners?.name || 'Établissement inconnu'}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">Offre {item.offer_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {historique.length > 4 && (
                <p className="text-center text-xs text-gray-400 pt-1">
                  + {historique.length - 4} autre{historique.length - 4 > 1 ? 's' : ''} dans votre historique
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 7. PROGRAMME AMBASSADEUR ── */}
        <div className="mb-8 section-animate" style={{ animationDelay: '0.4s' }}>
          <div className="relative rounded-[24px] overflow-hidden shadow-xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a2744] to-[#0c2340]" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-riviera-gold/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-riviera-azure/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-riviera-gold/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Emoji symbol="🎁" label="cadeau" size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg text-white">Programme Ambassadeur</p>
                  <p className="text-blue-300 text-sm">2 mois offerts par filleul Céleste</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/10 rounded-[18px] p-4 mb-5 flex items-center gap-4">
                <div className="flex-1 text-center border-r border-white/10 pr-4">
                  <p className="text-3xl font-bold text-white">{profil?.referral_count ?? 0}</p>
                  <p className="text-blue-300 text-xs mt-0.5">ami{(profil?.referral_count ?? 0) !== 1 ? 's' : ''} parrainé{(profil?.referral_count ?? 0) !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 text-center pl-4">
                  <p className="text-3xl font-bold text-riviera-gold">{((profil?.referral_count ?? 0) * 2)}</p>
                  <p className="text-blue-300 text-xs mt-0.5">mois offerts gagnés</p>
                </div>
              </div>

              {/* Referral link */}
              {profil?.referral_code ? (
                <div className="bg-white/10 rounded-[18px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-3">Votre lien d&apos;invitation</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white/70 flex-1 truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${profil.referral_code}` : `https://theclub-app.fr/?ref=${profil.referral_code}`}
                    </span>
                    <button
                      onClick={async () => {
                        const link = `${window.location.origin}/?ref=${profil.referral_code}`;
                        if (navigator.share) {
                          try { await navigator.share({ title: 'The Club', text: "Rejoins The Club !", url: link }); } catch (e) { if (e.name !== 'AbortError') console.error(e); }
                        } else {
                          try { await navigator.clipboard.writeText(link); alert('Lien copié ! 📋'); }
                          catch { prompt('Votre lien :', link); }
                        }
                      }}
                      className="shrink-0 bg-riviera-gold text-riviera-navy text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 active:scale-95 transition-all shadow-lg"
                    >
                      Copier le lien
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-blue-300 text-sm text-center">Accédez à l&apos;accueil pour générer votre lien de parrainage.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 8. MES INFORMATIONS ── */}
        <div className="mb-6 section-animate" style={{ animationDelay: '0.45s' }}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">Mes informations</h3>
          <div className="bg-white rounded-[20px] border border-gray-100 p-6">
            {infoMessage.text && (
              <div className={`p-3 rounded-[14px] text-sm mb-5 ${infoMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {infoMessage.text}
              </div>
            )}
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Email</label>
                {editingEmail ? (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={userEmail}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-[14px] text-sm focus:ring-2 focus:ring-riviera-azure focus:border-riviera-azure outline-none transition-all"
                    />
                    <button
                      onClick={handleUpdateEmail}
                      className="px-4 py-2.5 bg-riviera-navy text-white rounded-[14px] text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => { setEditingEmail(false); setNewEmail(''); }}
                      className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-[14px] text-sm hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{userEmail}</span>
                    <button
                      onClick={() => setEditingEmail(true)}
                      className="text-xs font-semibold text-riviera-azure hover:opacity-80 transition-opacity"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Téléphone</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-[14px] text-sm focus:ring-2 focus:ring-riviera-azure focus:border-riviera-azure outline-none transition-all"
                  />
                  <button
                    onClick={handleUpdatePhone}
                    disabled={savingPhone}
                    className="px-4 py-2.5 bg-riviera-navy text-white rounded-[14px] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {savingPhone ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Supprimer mon compte */}
        <div className="mb-4 section-animate" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-[18px] text-xs font-medium text-gray-400 border border-gray-100 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer mon compte
          </button>
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