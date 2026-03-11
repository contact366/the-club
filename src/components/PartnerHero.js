"use client";
import Link from 'next/link';
import { getImageSrc } from '@/lib/imageUtils';

export default function PartnerHero({ partner }) {
  const {
    name,
    city,
    ambiance,
    hero_image,
  } = partner;

  return (
    <section className="relative w-full h-[55vh] min-h-[400px] overflow-hidden">
      {/* Hero image */}
      <img
        src={getImageSrc(hero_image)}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay — heavier at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

      {/* Club badge — top left */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-8">
        <span className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
          Adresse membre du Club
        </span>
      </div>

      {/* Favourite button — top right */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8">
        <button
          aria-label="Ajouter aux favoris"
          className="w-9 h-9 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-full hover:bg-white/30 transition-all duration-200"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      {/* Name + city — bottom left */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-7 sm:px-10 sm:pb-10">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-1">
          {name}
        </h1>
        <p className="text-white/75 text-base sm:text-lg font-medium tracking-wide">
          {city}
          {ambiance ? <span className="text-white/45 mx-2">·</span> : null}
          {ambiance ? <span>{ambiance}</span> : null}
        </p>

        {/* Quick offer CTA inside hero */}
        <div className="mt-5">
          <Link
            href="#offres"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-riviera-gold text-riviera-navy text-sm font-bold rounded-full hover:brightness-110 transition-all duration-200 shadow-md"
          >
            Voir l&apos;offre découverte
          </Link>
        </div>
      </div>
    </section>
  );
}
