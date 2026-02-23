"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EspaceMembre() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    async function chargerDonnees() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // La requête corrigée qui fonctionne
      const { data: dataProfil } = await supabase
        .from('profiles')
        .select('subscription, montant_economise')
        .eq('id', user.id)
        .single();

      if (dataProfil) {
        // On ajoute la date de création issue de l'authentification
        setProfil({ 
          ...dataProfil, 
          created_at: user.created_at 
        });
      }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <p className="text-gray-500 animate-pulse">Chargement de votre espace VIP...</p>
      </div>
    );
  }

  // Détermination de la couleur pour le nouveau néon rotatif
  const isCeleste = profil?.subscription?.toLowerCase() === 'céleste' || profil?.subscription?.toLowerCase() === 'celeste';
  const neonThemeClass = isCeleste ? 'theme-celeste' : 'theme-explorer';

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-12">
      
      {/* 🌟 NOUVELLE CSS POUR L'EFFET "COMÈTE ROTATIVE" 🌟 */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Définition des couleurs selon le thème */
        .theme-celeste {
          --neon-color-head: #ffffff; /* Tête blanche brillante */
          --neon-color-tail: #EAB308; /* Traînée dorée */
        }
        .theme-explorer {
          --neon-color-head: #ffffff; /* Tête blanche brillante */
          --neon-color-tail: #3B82F6; /* Traînée bleue */
        }

        /* Le conteneur principal du badge */
        .neon-rotating-container {
          position: relative;
          border-radius: 9999px; /* rounded-full */
          padding: 2px; /* Épaisseur de la bordure lumineuse */
          overflow: hidden;
          isolation: isolate; /* Crée un nouveau contexte d'empilement */
        }

        /* La couche intermédiaire : Le gradient qui tourne */
        .neon-rotating-container::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(
            transparent 0deg,
            transparent 260deg,
            var(--neon-color-tail) 320deg, /* La traînée colorée */
            var(--neon-color-head) 360deg /* La tête blanche très lumineuse */
          );
          animation: rotate-border 3s linear infinite;
          z-index: -2;
        }

        /* La couche supérieure : Le cache noir au centre */
        .neon-rotating-container::after {
          content: '';
          position: absolute;
          inset: 2px; /* Doit correspondre au padding du conteneur */
          background: rgba(0, 0, 0, 0.65); /* Fond sombre */
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          z-index: -1;
        }

        /* L'animation de rotation */
        @keyframes rotate-border {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}} />

      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* BOUTON RETOUR À L'ACCUEIL */}
        <div className="pt-2">
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="p-2 bg-white rounded-full shadow-sm border border-gray-200/60 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Retour à l'accueil
          </Link>
        </div>

        {/* EN-TÊTE */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Mon Espace</h1>
          <p className="text-gray-500 mt-2 text-lg">Gérez votre pass et suivez vos avantages.</p>
        </div>

        {/* LA CARTE VIP */}
        <div className="relative bg-gradient-to-tr from-gray-900 via-gray-800 to-black rounded-3xl p-8 text-white shadow-2xl overflow-hidden min-h-[160px] flex items-center">
          {/* Effet de brillance arrière-plan */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between w-full items-start md:items-center gap-8">
            
            {/* PARTIE GAUCHE : LE NOUVEAU BADGE ROTATIF */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">
                Statut du membre
              </p>
              
              {/* Le conteneur du badge avec la nouvelle classe CSS et le thème */}
              <div className={`neon-rotating-container inline-block ${neonThemeClass}`}>
                {/* Le contenu du badge (doit être en relative pour passer au dessus du cache) */}
                <div className="relative z-10 flex items-center gap-3 px-5 py-2 rounded-full">
                  <span className={`text-xl font-bold tracking-tight capitalize ${isCeleste ? 'text-yellow-400' : 'text-blue-400'}`}>
                    Pass {profil?.subscription || 'Aucun'}
                  </span>
                  {/* La petite lumière pulsante reste en bonus */}
                  <span className="flex w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                </div>
              </div>

            </div>
            
            {/* PARTIE DROITE : LE CARROUSEL ANIMÉ */}
            <div className="relative h-20 w-full md:w-64 overflow-hidden">
              {/* SLIDE 1 : Total Économisé */}
              <div className={`absolute right-0 top-0 w-full text-left md:text-right transition-all duration-700 ease-in-out transform ${
                activeSlide === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
              }`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">
                  Total Économisé
                </p>
                <p className="text-5xl font-light tracking-tighter text-white">
                  {profil?.montant_economise || '0.00'}<span className="text-2xl text-gray-400 ml-1">€</span>
                </p>
              </div>

              {/* SLIDE 2 : Membre depuis */}
              <div className={`absolute right-0 top-0 w-full text-left md:text-right transition-all duration-700 ease-in-out transform ${
                activeSlide === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
              }`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">
                  Membre depuis
                </p>
                <p className="text-3xl font-light tracking-tight text-white mt-2">
                  {profil?.created_at 
                    ? new Date(profil.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                    : 'Récemment'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* L'HISTORIQUE (inchangé) */}
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
                <p className="text-gray-400 text-sm mt-1">Vos prochaines économies apparaîtront ici.</p>
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
                        <p className="text-lg font-semibold text-gray-900">
                          {item.partners?.name || 'Établissement inconnu'}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          Offre {item.offer_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
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