import Emoji from '@/components/Emoji';
import Link from 'next/link';

const SECTIONS = [
  {
    id: 'new-places',
    emoji: '🔥',
    label: 'new-places',
    title: 'New places',
    description: 'Freshly added establishments — be among the first to try them.',
    href: '/gastronomie',
    cta: 'Explore new places',
    cards: [
      { label: 'Restaurant', city: 'Nice' },
      { label: 'Bar & Cocktails', city: 'Cannes' },
      { label: 'Bistrot', city: 'Monaco' },
    ],
  },
  {
    id: 'popular-members',
    emoji: '⭐',
    label: 'popular-members',
    title: 'Popular among members',
    description: 'The most visited and highest-rated spots by The Club community.',
    href: '/loisirs',
    cta: 'See popular spots',
    cards: [
      { label: 'Gastronomie', city: 'Nice' },
      { label: 'Bien-être', city: 'Antibes' },
      { label: 'Loisirs', city: 'Cannes' },
    ],
  },
  {
    id: 'exclusive-offers',
    emoji: '💎',
    label: 'exclusive-offers',
    title: 'Exclusive offers',
    description: 'Members-only deals up to −50% at premium Riviera addresses.',
    href: '/bien-etre',
    cta: 'View exclusive offers',
    cards: [
      { label: 'Spa & Wellness', city: 'Monaco' },
      { label: 'Fine Dining', city: 'Nice' },
      { label: 'Experience', city: 'Cannes' },
    ],
  },
];

function PlaceholderCard({ label, city }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-end p-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="px-4 py-3">
        <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-2" />
        <p className="text-xs text-gray-400">{city}</p>
      </div>
    </div>
  );
}

export default function DiscoverSections() {
  return (
    <section className="py-16 bg-[#F5F5F7]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {SECTIONS.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
              <h2 className="flex items-center gap-2.5 text-2xl font-bold text-riviera-navy">
                <Emoji symbol={section.emoji} label={section.label} size={26} />
                {section.title}
              </h2>
              <Link
                href={section.href}
                className="text-sm font-semibold text-riviera-azure hover:text-riviera-navy transition-colors duration-200"
              >
                {section.cta} →
              </Link>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm mb-5">{section.description}</p>

            {/* Placeholder card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {section.cards.map((card, index) => (
                <PlaceholderCard key={`${section.id}-${index}`} label={card.label} city={card.city} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
