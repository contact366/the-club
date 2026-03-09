"use client";
import EstablishmentCard from '@/components/EstablishmentCard';

export default function SimilarExperiences({ experiences }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">
        Autres expériences à découvrir
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {experiences.map((exp) => (
          <EstablishmentCard
            key={exp.slug}
            href={`/experiences/${exp.slug}`}
            name={exp.name}
            image={exp.image}
            city={exp.city}
            offerLabel={exp.category}
          />
        ))}
      </div>
    </section>
  );
}
