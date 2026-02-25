"use client";
import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ["Toutes", "Parcs d'attractions", "Spectacles", "Cinéma", "Sport"];

const PARCS = [
  {
    nom: "DISNEYLAND PARIS",
    image: "https://images.unsplash.com/photo-1560179406-1c6c60e0dc76?auto=format&fit=crop&w=800&q=80",
    categorie: "Parcs d'attractions",
  },
  {
    nom: "FUTUROSCOPE",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    categorie: "Parcs d'attractions",
  },
  {
    nom: "PARC ASTÉRIX",
    image: "https://images.unsplash.com/photo-1501698373729-a9e77e5fc11c?auto=format&fit=crop&w=800&q=80",
    categorie: "Parcs d'attractions",
  },
];

export default function EBilletteriePage() {
  const [categorieActive, setCategorieActive] = useState("Toutes");

  const parcsFiltres = categorieActive === "Toutes"
    ? PARCS
    : PARCS.filter((p) => p.categorie === categorieActive);

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
            <span className="text-5xl">🎟️</span>
            <div>
              <div className="inline-block bg-white/90 text-riviera-navy border border-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">Concerts & Parcs</div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-riviera-navy">E-billetterie</h1>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-xl">Vos places de spectacles, cinémas et parcs d'attractions à prix réduits.</p>
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
        {parcsFiltres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parcsFiltres.map((parc) => (
              <div key={parc.nom} className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md group">
                <img
                  src={parc.image}
                  alt={parc.nom}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-white font-bold text-2xl mb-1">{parc.nom}</h3>
                  <p className="text-gray-300 text-xs">Tarifs préférentiels à venir</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/90 text-riviera-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Bientôt disponible</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🎟️</p>
            <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-2">Offres à venir</h2>
            <p className="text-gray-500">Les offres dans cette catégorie arrivent bientôt.</p>
          </div>
        )}
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
