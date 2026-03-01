"use client";
import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ["Toutes", "Mode", "High-Tech", "Beauté", "Maison", "Voyage"];

export default function ExcluWebPage() {
  const [categorieActive, setCategorieActive] = useState("Toutes");

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

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

    </div>
  );
}
