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

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <PartnerHero partner={partner} />

      {/* Description */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-4">
          À propos
        </h2>
        <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
          {partner.description}
        </p>
      </section>

      <PartnerOffers offers={partner.offers} />
      <PartnerInfo partner={partner} />
      <PartnerGallery images={partner.gallery_images} partnerName={partner.name} />
      <PartnerReviews rating={partner.rating} reviews={partner.reviews} />
      <SimilarExperiences experiences={SIMILAR_EXPERIENCES} />
    </div>
  );
}
