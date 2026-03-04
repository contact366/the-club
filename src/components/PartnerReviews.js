function StarIcon({ filled }) {
  return (
    <svg
      className={`w-4 h-4 ${filled ? 'text-riviera-gold' : 'text-gray-200'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
    </svg>
  );
}

export default function PartnerReviews({ rating, reviews }) {
  const fullStars = Math.floor(rating);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-riviera-navy">
          Avis membres
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} filled={i < fullStars} />
            ))}
          </div>
          <span className="font-bold text-riviera-navy">{rating}</span>
          <span className="text-gray-400 text-sm">/ 5</span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <StarIcon key={j} filled={j < (review.rating ?? fullStars)} />
              ))}
            </div>
            <p className="text-sm text-gray-700 italic">&ldquo;{review.text}&rdquo;</p>
            {review.author && (
              <p className="text-xs text-gray-400 mt-2 font-medium">{review.author}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
