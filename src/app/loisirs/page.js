"use client";
import { useState } from 'react';
import Link from 'next/link';

const VILLES = ["Toutes", "Nice", "Cannes", "Monaco", "Antibes", "Cagnes-sur-Mer"];

export default function LoisirsPage() {
  const [villeActive, setVilleActive] = useState("Toutes");

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-bold text-xl tracking-widest text-riviera-navy">THE CLUB</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🎯</span>
            <div>
              <div className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">Jusqu'à -30%</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy">Loisirs</h1>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-xl">Activités inédites, expériences uniques et sorties incontournables.</p>
        </div>
      </section>

      {/* Filtres par ville */}
      <section className="bg-white border-b border-gray-200 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {VILLES.map((ville) => (
              <button
                key={ville}
                onClick={() => setVilleActive(ville)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  villeActive === ville
                    ? 'bg-riviera-navy text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ville}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille des offres */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🎯</p>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-2">Offres à venir</h2>
          <p className="text-gray-500">Les meilleures activités{villeActive !== "Toutes" ? ` à ${villeActive}` : " de la Riviera"} arrivent bientôt.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-riviera-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-serif font-bold text-lg tracking-widest mb-2">THE CLUB</p>
          <p className="text-gray-400 text-sm">© 2025 The Club. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
