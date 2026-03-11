import PartnerHero from '@/components/PartnerHero';
import PartnerOffers from '@/components/PartnerOffers';
import PartnerInfo from '@/components/PartnerInfo';
import PartnerGallery from '@/components/PartnerGallery';
import PartnerReviews from '@/components/PartnerReviews';
import SimilarExperiences from '@/components/SimilarExperiences';

// ---------------------------------------------------------------------------
// Mock data — replace with a Supabase query once the DB is ready:
//   const { data } = await supabase.from('partners').select('*').eq('slug', slug).single();
// ---------------------------------------------------------------------------
const PARTNERS = [
  {
    slug: 'lou-pantail-nice',
    name: 'Lou Pantail',
    category: 'Restaurant',
    city: 'Nice',
    ambiance: 'Calme',
    description:
      "Situé sur les hauteurs de Nice, Lou Pantail propose une cuisine méditerranéenne raffinée dans une atmosphère élégante et paisible. L'adresse parfaite pour un dîner gourmand loin de l'agitation du centre-ville.",
    address: '107 Av. Saint-Lambert, 06100 Nice',
    opening_hours: { lunch: '12h – 14h', dinner: '19h – 22h' },
    phone: '04 93 00 00 00',
    website: 'https://lou-pantail.fr',
    instagram: 'https://instagram.com/loupantail',
    hero_image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    gallery_images: [
      {
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        alt: 'Salle du restaurant',
      },
      {
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        alt: 'Plat signature',
      },
      {
        url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
        alt: 'Terrasse',
      },
      {
        url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
        alt: 'Ambiance du restaurant',
      },
      {
        url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
        alt: 'Détail de table',
      },
    ],
    offers: [
      {
        type: 'decouverte',
        title: '1 entrée au choix offerte',
        conditions: [
          'Valable une fois par an',
          'Hors boissons',
          'Réservation conseillée',
        ],
      },
      {
        type: 'permanente',
        title: '-10% sur l\'addition',
        conditions: [
          'Valable toute l\'année',
          'Non cumulable avec d\'autres offres',
        ],
      },
    ],
    rating: 4.8,
    reviews: [
      {
        text: 'Super découverte avec le Club. Cuisine excellente et cadre magnifique.',
        author: 'Marie L.',
        rating: 5,
      },
      {
        text: "On a rentabilisé l'abonnement en une soirée.",
        author: 'Thomas R.',
        rating: 5,
      },
    ],
  },
];

const SIMILAR_EXPERIENCES = [
  {
    slug: 'riviera-gourmet',
    name: 'Restaurant Riviera Gourmet',
    category: 'Restaurant',
    city: 'Cannes',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  },
  {
    slug: 'spa-azure',
    name: 'Spa Azure',
    category: 'Bien-être',
    city: 'Nice',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  },
  {
    slug: 'bar-sunset-lounge',
    name: 'Bar Sunset Lounge',
    category: 'Bar',
    city: 'Monaco',
    image:
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
  },
];

// ---------------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const partner = PARTNERS.find((p) => p.slug === slug);
  if (!partner) return { title: 'Expérience — The Club' };
  return {
    title: `${partner.name} — The Club`,
    description: partner.description,
  };
}

export default async function ExperiencePage({ params }) {
  const { slug } = await params;

  // Future Supabase integration:
  // const { data: partner } = await supabase.from('partners').select('*').eq('slug', slug).single();

  const partner = PARTNERS.find((p) => p.slug === slug);

  if (!partner) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-riviera-navy mb-2">
            Partenaire introuvable
          </h1>
          <p className="text-gray-500">Cette expérience n&apos;existe pas encore.</p>
        </div>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      {/* ── 1. Hero ──────────────────────────────────────────────── */}
      <PartnerHero partner={partner} />

      {/* ── 2. Info card ─────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto -mt-5 relative z-10 px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* Rating + Category */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5">
              <svg className="w-5 h-5 text-riviera-gold" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
              </svg>
              <span className="font-bold text-riviera-navy text-base">{partner.rating}</span>
              <span className="text-gray-400 text-sm">/ 5</span>
            </div>
            <span className="text-gray-200">|</span>
            <span className="text-sm text-gray-500 font-medium">{partner.category}</span>
          </div>

          {/* Member offer badge */}
          {partner.offers?.[0] && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Offre membre
              </p>
              <p className="font-serif text-lg font-bold text-riviera-navy leading-snug">
                {partner.offers[0].title}
              </p>
              {partner.offers[1] && (
                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-riviera-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                  </svg>
                  + {partner.offers[1].title}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Description ───────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-4">
          À propos
        </h2>
        <p className="text-gray-600 text-base leading-relaxed">
          {partner.description}
        </p>
      </section>

      {/* ── 4. Gallery (horizontal scroll) ───────────────────────── */}
      <PartnerGallery images={partner.gallery_images} partnerName={partner.name} />

      {/* ── 5. Offers ────────────────────────────────────────────── */}
      <PartnerOffers offers={partner.offers} />

      {/* ── 6. Practical info ────────────────────────────────────── */}
      <PartnerInfo partner={partner} />

      {/* ── 7. Reviews ───────────────────────────────────────────── */}
      <PartnerReviews rating={partner.rating} reviews={partner.reviews} />

      {/* ── 8. Similar experiences ───────────────────────────────── */}
      <SimilarExperiences experiences={SIMILAR_EXPERIENCES} />

      {/* ── 9. Fixed bottom action bar ───────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          <a
            href="#offres"
            className="flex-1 py-3.5 bg-riviera-navy text-white text-sm font-bold rounded-2xl text-center hover:bg-gray-900 transition-colors duration-200 shadow-sm"
          >
            Utiliser l&apos;offre
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3.5 bg-riviera-azure text-white text-sm font-bold rounded-2xl text-center hover:bg-sky-700 transition-colors duration-200 shadow-sm"
          >
            Itinéraire
          </a>
        </div>
      </div>
    </div>
  );
}
