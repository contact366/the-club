"use client";
import Link from 'next/link';
import { getImageSrc } from '@/lib/imageUtils';

export default function PartnerHero({ partner }) {
  const {
    name,
    category,
    city,
    ambiance,
    address,
    hero_image,
    offers,
  } = partner;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="relative w-full h-[70vh] min-h-[520px] overflow-hidden">
      <img
        src={getImageSrc(hero_image)}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-7xl mx-auto">
        {/* Club badge */}
        <span className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
          Adresse membre du Club
        </span>

        {/* Category + City + Ambiance */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-white/70 text-sm font-medium">{category}</span>
          <span className="text-white/40 text-sm">·</span>
          <span className="text-white/70 text-sm font-medium">{city}</span>
          <span className="text-white/40 text-sm">·</span>
          <span className="text-white/70 text-sm font-medium">{ambiance}</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
          {name}
        </h1>

        <p className="text-white/70 text-sm mb-4">{address}</p>

        {/* Offer badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {offers.map((offer) => (
            <span
              key={offer.type}
              className="inline-block bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              {offer.type === 'decouverte' ? 'Découverte' : 'Permanente'} : {offer.title}
            </span>
          ))}
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/30 text-white/70 text-xs px-3 py-1.5 rounded-full">
            Économie moyenne : 18€
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <a
            href="#offres"
            className="px-6 py-3 bg-riviera-gold text-riviera-navy text-sm font-bold rounded-full hover:brightness-110 transition-all duration-200 shadow-md"
          >
            Voir l&apos;offre découverte
          </a>
          <button
            aria-label="Ajouter aux favoris"
            className="px-6 py-3 bg-white/15 backdrop-blur-sm border border-white/40 text-white text-sm font-semibold rounded-full hover:bg-white/25 transition-all duration-200"
          >
            Ajouter aux favoris
          </button>
        </div>
      </div>
    </section>
  );
}
