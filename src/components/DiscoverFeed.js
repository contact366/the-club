"use client";
import { useState } from 'react';
import EstablishmentCard from '@/components/EstablishmentCard';
import { generatePartnerSlug } from '@/lib/slugUtils';

const CATEGORIES = ['Restaurants', 'Bars', 'Activities', 'Wellness', 'Hotels'];

/** Maps UI pill labels to partner category keywords stored in the DB */
const CATEGORY_KEYWORDS = {
  Restaurants: 'gastronomie',
  Bars: 'bar',
  Activities: 'loisirs',
  Wellness: 'bien-etre',
  Hotels: 'hotel',
};

function getOfferLabel(partner) {
  if (partner.offer_decouverte || partner.offer_permanente) {
    const discount = partner.discount_decouverte ?? partner.discount_permanente;
    return discount ? `-${discount}%` : 'Offre exclusive';
  }
  return null;
}

function getHref(partner) {
  return `/experiences/${partner.slug || generatePartnerSlug(partner.name, partner.address)}`;
}

function DiscoverSection({ title, partners }) {
  if (!partners || partners.length === 0) return null;
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-riviera-navy px-4 sm:px-6 mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 hide-scrollbar">
        {partners.map((partner) => (
          <div key={partner.id} className="shrink-0 w-64 sm:w-72">
            <EstablishmentCard
              href={getHref(partner)}
              name={partner.name}
              image={partner.photo_url}
              city={partner.address}
              offerLabel={getOfferLabel(partner)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-64 sm:w-72 bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function SkeletonSection({ title }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-riviera-navy px-4 sm:px-6 mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 hide-scrollbar">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export default function DiscoverFeed({ partners = [], partnersLoading = false }) {
  const [activeCategory, setActiveCategory] = useState(null);

  /** Filter the full list by active category pill (client-side, no extra fetches) */
  const visiblePartners = activeCategory
    ? partners.filter((p) => {
        const keyword = CATEGORY_KEYWORDS[activeCategory] || activeCategory.toLowerCase();
        return p.category && p.category.toLowerCase().includes(keyword);
      })
    : partners;

  const newPlaces = visiblePartners.slice(0, 12);

  /** "Popular" = partners with the largest combined discount (proxy for popularity) */
  const popularPlaces = [...visiblePartners]
    .sort((a, b) => {
      const scoreA = (a.discount_decouverte || 0) + (a.discount_permanente || 0);
      const scoreB = (b.discount_decouverte || 0) + (b.discount_permanente || 0);
      return scoreB - scoreA;
    })
    .slice(0, 12);

  const exclusiveOffers = visiblePartners
    .filter((p) => p.offer_decouverte || p.offer_permanente)
    .slice(0, 12);

  return (
    <section className="py-10 bg-[#F5F5F7]">
      {/* Search bar + location indicator */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-riviera-azure shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.697 3.5-8.333 0-4.36-3.515-7.498-7.25-7.498S4.75 7.642 4.75 12c0 3.636 1.555 6.33 3.5 8.333a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.144.742ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-riviera-navy">Côte d&apos;Azur</span>
          </div>

          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search places"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riviera-navy/20 text-sm"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Category pills — horizontally scrollable on mobile */}
      <div className="mb-8 px-4 sm:px-6">
        <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-riviera-navy ${
                activeCategory === cat
                  ? 'bg-riviera-navy text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-riviera-navy/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery sections */}
      {partnersLoading ? (
        <>
          <SkeletonSection title="🔥 New places" />
          <SkeletonSection title="⭐ Popular among members" />
          <SkeletonSection title="💎 Exclusive offers" />
        </>
      ) : (
        <>
          <DiscoverSection title="🔥 New places" partners={newPlaces} />
          <DiscoverSection title="⭐ Popular among members" partners={popularPlaces} />
          {exclusiveOffers.length > 0 && (
            <DiscoverSection title="💎 Exclusive offers" partners={exclusiveOffers} />
          )}
        </>
      )}
    </section>
  );
}

