export default function PartnerOffers({ offers }) {
  return (
    <section id="offres" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">
        Vos avantages Club
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.type}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="inline-block bg-riviera-gold text-riviera-navy text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {offer.type === 'decouverte' ? 'Offre découverte' : 'Offre permanente'}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-riviera-navy mb-4">
              {offer.title}
            </h3>
            <ul className="space-y-2 mb-6">
              {offer.conditions.map((cond, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 text-riviera-gold flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {cond}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 bg-riviera-navy text-white text-sm font-bold rounded-2xl hover:bg-gray-900 transition-colors duration-200 shadow-sm">
              Activer l&apos;offre
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
