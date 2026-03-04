"use client";
import Link from 'next/link';
import { getImageSrc, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export default function SimilarExperiences({ experiences }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">
        Autres expériences à découvrir
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {experiences.map((exp) => (
          <Link
            key={exp.slug}
            href={`/experiences/${exp.slug}`}
            className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md group block"
          >
            <img
              src={getImageSrc(exp.image)}
              alt={exp.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="text-white font-bold text-xl mb-1">{exp.name}</h3>
              {exp.city && (
                <p className="text-gray-300 text-xs mb-2">{exp.city}</p>
              )}
              <span className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {exp.category}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
