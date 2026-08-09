"use client";

const MOODS = [
  { id: 'escapade', label: 'ESCAPADE', title: 'Partir sans partir.', bg: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600&q=70' },
  { id: 'adeux',    label: 'À DEUX',   title: 'Créer un moment qui compte.', bg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=70' },
  { id: 'bienetre', label: 'BIEN-ÊTRE',title: 'Prendre du temps pour soi.', bg: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=70' },
  { id: 'sortir',   label: 'SORTIR',   title: 'Profiter de la soirée.', bg: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=70' },
  { id: 'aventure', label: 'AVENTURE', title: 'Faire quelque chose de différent.', bg: 'https://images.unsplash.com/photo-1588499756884-d72584d84df5?auto=format&fit=crop&w=600&q=70' },
  { id: 'gourmand', label: 'GOURMAND', title: 'Découvrir une nouvelle adresse.', bg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=70' },
];

export default function MoodExplorer({ activeMood, onMoodSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {MOODS.map((mood) => {
        const active = activeMood === mood.id;
        return (
          <button
            key={mood.id}
            onClick={() => onMoodSelect(active ? null : mood.id)}
            className="relative aspect-[3/4] rounded-[10px] overflow-hidden cursor-pointer transition-transform duration-500 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-navy"
            style={{ background: '#173F55' }}
          >
            {/* Background image */}
            <img
              src={mood.bg}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {/* Active ring */}
            {active && (
              <div className="absolute inset-0 ring-2 ring-white ring-inset rounded-[10px]" />
            )}
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
              <span
                className="text-[10px] tracking-[0.12em] uppercase mb-2 text-white/70"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                {mood.label}
              </span>
              <h3 className="text-[18px] font-display font-medium text-white leading-[1.1]">
                {mood.title}
              </h3>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Export mood→category mapping for page.js filtering
export const MOOD_CATEGORIES = {
  escapade: ['hôtel', 'hébergement', 'séjour', 'escapade', 'spa', 'wellness'],
  adeux:    [],
  bienetre: ['bien-être', 'spa', 'santé', 'beauté', 'relaxation', 'massage', 'fitness'],
  sortir:   ['bar', 'sortie', 'soirée', 'spectacle', 'concert', 'club', 'boîte'],
  aventure: ['loisirs', 'activité', 'aventure', 'sport', 'simulateur', 'vol'],
  gourmand: ['restaurant', 'gastronomie', 'cuisine', 'brasserie', 'bistrot', 'café'],
};
