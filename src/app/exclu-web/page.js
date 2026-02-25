"use client";
import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ["Toutes", "Mode", "High-Tech", "Beauté", "Maison", "Voyage"];

export default function ExcluWebPage() {
  const [categorieActive, setCategorieActive] = useState("Toutes");

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

      {/* Bandeau Bientôt disponible */}
      <div className="bg-riviera-navy text-white text-center py-2 text-sm font-semibold tracking-wide">
        🛒 Bientôt disponible — Les offres exclusives arrivent prochainement
      </div>

      {/* Hero */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🛒</span>
            <div>
              <div className="inline-block bg-white/90 text-riviera-navy border border-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">Offres Nationales</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy">Exclu Web</h1>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-xl">Réductions exclusives sur vos marques préférées en ligne.</p>
        </div>
      </section>

      {/* Filtres par catégorie */}
      <section className="bg-white border-b border-gray-200 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  categorieActive === cat
                    ? 'bg-riviera-navy text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille des offres */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-24">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-2">Offres à venir</h2>
          <p className="text-gray-500">
            Les meilleures offres{categorieActive !== "Toutes" ? ` en ${categorieActive}` : ""} arrivent bientôt.
          </p>
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
