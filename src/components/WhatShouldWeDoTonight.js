"use client";
import { useState, useMemo } from 'react';
import EstablishmentCard from '@/components/EstablishmentCard';
import { generatePartnerSlug } from '@/lib/slugUtils';

/**
 * "What should we do tonight?" discovery component.
 *
 * Props
 *   partners  – array of partner objects already loaded on the Discover page
 *   isMember  – boolean membership state (passed through to EstablishmentCard)
 */
export default function WhatShouldWeDoTonight({ partners = [], isMember }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSeed, setSuggestionSeed] = useState(0);

  const suggestions = useMemo(() => {
    if (partners.length === 0) return [];
    // Fisher-Yates shuffle seeded by suggestionSeed
    const shuffled = [...partners];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use a deterministic but seed-dependent index based on suggestionSeed and position
      const j = Math.abs((suggestionSeed * 1103515245 + i * 12345) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [partners, suggestionSeed]);

  const handleSuggest = () => {
    setSuggestionSeed((s) => s + 1);
    setShowSuggestions(true);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Main discovery card */}
      <div className="bg-riviera-navy rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-riviera-gold/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-riviera-azure/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
          {/* Dice icon */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl sm:text-5xl shadow-lg select-none" aria-hidden="true">
            🎲
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
              Que fait-on ce soir ?
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Découvrez un lieu à tester autour de vous.
            </p>
          </div>

          {/* CTA button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleSuggest}
              className="inline-flex items-center gap-2 bg-riviera-gold text-riviera-navy font-bold px-7 py-4 rounded-2xl text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-riviera-gold/50 min-h-[52px] touch-manipulation"
              aria-expanded={showSuggestions}
              aria-controls="tonight-suggestions"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2L9.5 9.5H2l6 4.5-2.5 7.5L12 17l6.5 4.5L16 14l6-4.5h-7.5z" />
              </svg>
              Proposer des lieux
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions panel */}
      {showSuggestions && (
        <div
          id="tonight-suggestions"
          className="mt-6 animate-fade-in"
          role="region"
          aria-label="Suggested establishments"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-riviera-navy">
                  3 suggestions for tonight ✨
                </p>
                <button
                  onClick={handleSuggest}
                  className="text-xs font-semibold text-riviera-azure hover:text-riviera-navy transition-colors duration-200 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-azure rounded"
                  aria-label="Roll new suggestions"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 4v6h6" />
                    <path d="M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  Roll again
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {suggestions.map((partner) => {
                  let offerLabel;
                  if (partner.offer_decouverte || partner.offer_permanente) {
                    const discount = partner.discount_decouverte ?? partner.discount_permanente;
                    offerLabel = discount ? `-${discount}%` : 'Offre exclusive';
                  }
                  return (
                    <EstablishmentCard
                      key={partner.id}
                      href={`/experiences/${partner.slug || generatePartnerSlug(partner.name, partner.address)}`}
                      name={partner.name}
                      image={partner.photo_url}
                      city={partner.address}
                      offerLabel={offerLabel}
                      isMember={isMember}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No establishments available yet. Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
