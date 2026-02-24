"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export default function EspaceMembre() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // 🌟 NOUVEAUX ÉTATS POUR LES FONCTIONNALITÉS PREMIUM
  const [userEmail, setUserEmail] = useState('');
  const [userFirstName, setUserFirstName] = useState(''); // Nouveau : prénom de l'utilisateur
  const [offresUtiliseesMois, setOffresUtiliseesMois] = useState(0);

  useEffect(() => {
    async function chargerDonnees() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email);

      const { data: dataProfil } = await supabase
        .from('profiles')
        .select('subscription_type, montant_economise, first_name')
        .eq('id', user.id)
        .single();

      if (dataProfil) {
        setProfil({ ...dataProfil, created_at: user.created_at });
        // On récupère le prénom depuis la BDD
        setUserFirstName(dataProfil.first_name || userEmail.split('@')[0]);
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

      setLoading(false);
    }

    chargerDonnees();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <p className="text-gray-500 animate-pulse">Chargement de votre espace VIP...</p>
      </div>
    );
  }

  const planName = profil?.subscription_type?.toLowerCase() || '';
  const isCercle = planName.includes('cercle');
  const isCeleste = planName.includes('celeste') || planName.includes('céleste');

  let neonThemeClass = 'theme-explorer';
  if (isCercle) neonThemeClass = 'theme-cercle';
  else if (isCeleste) neonThemeClass = 'theme-celeste';

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-12">
      
      {/* CSS DE L'EFFET NÉON (Inchangé) */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-celeste { --neon-color-head: #ffffff; --neon-color-tail: #EAB308; }
        .theme-explorer { --neon-color-head: #ffffff; --neon-color-tail: #3B82F6; }
        .theme-cercle { --neon-color-head: #ffffff; --neon-color-tail: #94a3b8; }
        .bg-carbon {
          background-color: #0a0a0a;
          background-image: linear-gradient(45deg, #111 25%, transparent 25%),
                            linear-gradient(-45deg, #111 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #111 75%),
                            linear-gradient(-45deg, transparent 75%, #111 75%);
          background-size: 4px 4px;
        }
        .neon-rotating-container { position: relative; border-radius: 9999px; padding: 2px; overflow: hidden; isolation: isolate; }
        .neon-rotating-container::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent 0deg, transparent 260deg, var(--neon-color-tail) 320deg, var(--neon-color-head) 360deg);
          animation: rotate-border 3s linear infinite; z-index: -2;
        }
        .neon-rotating-container::after { content: ''; position: absolute; inset: 2px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); border-radius: 9999px; z-index: -1; }
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
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-gray-200 to-gray-100 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold shadow-inner border border-white shrink-0">
                {userFirstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium">Membre</p>
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 truncate">
                  {userFirstName}
                </h2>
              </div>
            </div>
            {/* Bouton engrenage → Stripe Portal */}
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
  );
}