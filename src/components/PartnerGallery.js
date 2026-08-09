"use client";
import { getImageSrc, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export default function PartnerGallery({ images, partnerName }) {
  return (
    <section className="pb-12">
      <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        Galerie photos
      </h2>

      {/* Horizontal scroll gallery */}
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 hide-scrollbar snap-x snap-mandatory">
        {images.map((img, i) => (
          <div
            key={i}
            className="flex-none w-64 h-48 sm:w-80 sm:h-60 rounded-2xl overflow-hidden snap-start shadow-sm"
          >
            <img
              src={getImageSrc(img.url)}
              alt={img.alt || `${partnerName} — photo ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
