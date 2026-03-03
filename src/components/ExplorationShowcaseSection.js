"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Emoji from '@/components/Emoji';

// Données statiques des badges (section marketing/showcase)
const badges = [
  {
    emoji: '🗺️',
    title: 'Riviera Explorer',
    description: '3 établissements validés',
    current: 2,
    required: 3,
    color: 'blue',
    unlocked: false,
    isGold: false,
  },
  {
    emoji: '🍽️',
    title: 'Riviera Gourmet',
    description: '3 restaurants validés',
    current: 1,
    required: 3,
    color: 'amber',
    unlocked: false,
    isGold: false,
  },
  {
    emoji: '🧘',
    title: 'Riviera Wellness',
    description: '2 établissements bien-être',
    current: 2,
    required: 2,
    color: 'teal',
    unlocked: true,
    isGold: false,
  },
  {
    emoji: '👑',
    title: 'Gold Riviera Insider',
    description: '6 établissements validés',
    current: 4,
    required: 6,
    color: 'yellow',
    unlocked: false,
    isGold: true,
  },
];

// Correspondance couleur → classes Tailwind (évite les classes dynamiques non purgées)
const colorMap = {
  blue: { bg: 'bg-blue-500/20', bar: 'bg-blue-500', text: 'text-blue-400' },
  amber: { bg: 'bg-amber-500/20', bar: 'bg-amber-500', text: 'text-amber-400' },
  teal: { bg: 'bg-teal-500/20', bar: 'bg-teal-500', text: 'text-teal-400' },
  yellow: { bg: 'bg-yellow-500/20', bar: 'bg-yellow-500', text: 'text-yellow-400' },
};

// Délais d'animation échelonnés par carte
const animationDelays = ['delay-100', 'delay-200', 'delay-300', 'delay-[400ms]'];

export default function ExplorationShowcaseSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation des barres de progression au scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-32 bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628]"
    >
      {/* Éléments décoratifs de fond */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />

      <div className="max-w-[1200px] mx-auto px-6">

        {/* BLOC 1 : Titre principal */}
        <div className="text-center mb-20">
          <span className="inline-block uppercase tracking-widest text-xs font-semibold text-amber-400 mb-4">
            Exploration Riviera
          </span>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
            La Riviera n&apos;est pas une liste d&apos;adresses.<br />
            C&apos;est un territoire à conquérir.
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Chaque expérience validée vous rapproche d&apos;un nouveau statut.
            Restaurants confidentiels, spas d&apos;exception, lieux cachés…
            Explorez. Progressez. Débloquez.
          </p>
        </div>

        {/* BLOC 2 : Grille des 4 badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {badges.map((badge, index) => {
            const colors = colorMap[badge.color];
            const delay = animationDelays[index];
            const progressWidth = isVisible
              ? `${(badge.current / badge.required) * 100}%`
              : '0%';

            return (
              <div
                key={badge.title}
                className={`group relative bg-white/[0.07] backdrop-blur-sm border border-white/[0.1] rounded-3xl p-6
                  hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-[1.03] hover:shadow-2xl
                  transition-all duration-500 ease-out cursor-default
                  ${badge.isGold ? 'ring-1 ring-yellow-500/20' : ''}`}
              >
                {/* Halo doré pour le badge Gold uniquement */}
                {badge.isGold && (
                  <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-yellow-500/10 via-transparent to-amber-500/10 pointer-events-none" />
                )}

                <div className="relative z-10">
                  {/* Icône */}
                  <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center mb-4`}>
                    <Emoji symbol={badge.emoji} label={badge.title} size={24} />
                  </div>

                  {/* Titre */}
                  <h3 className="text-white font-bold text-lg mb-1">{badge.title}</h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4">{badge.description}</p>

                  {/* Barre de progression */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out ${delay}`}
                      style={{ width: progressWidth }}
                    />
                  </div>

                  {/* État */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {badge.current}/{badge.required}
                    </span>
                    {badge.unlocked ? (
                      <span className={`text-xs font-semibold ${colors.text} flex items-center gap-1`}>
                        <Emoji symbol="✨" label="débloqué" size={12} /> Débloqué
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Emoji symbol="🔒" label="verrouillé" size={12} /> En cours
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BLOC 3 : Différenciation */}
        <div className="text-center mb-16">
          <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto">
            Ici, chaque sortie compte.<br />
            Vous ne consommez pas une offre.<br />
            <span className="font-bold text-white">Vous construisez votre statut.</span>
          </p>
        </div>

        {/* BLOC 4 : CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/#tarifs"
            className="bg-white text-riviera-navy font-semibold px-8 py-4 rounded-2xl
              hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Commencer mon exploration
          </Link>
          <Link
            href="/profil"
            className="border border-white/30 text-white/80 px-6 py-3 rounded-2xl
              hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            Découvrir les badges
          </Link>
        </div>

      </div>
    </section>
  );
}
