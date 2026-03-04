"use client";
import { getImageSrc, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export default function PartnerGallery({ images, partnerName }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="font-serif text-2xl font-bold text-riviera-navy mb-6">
        Galerie photos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 md:col-span-1 row-span-2' : ''}`}
          >
            <img
              src={getImageSrc(img.url)}
              alt={img.alt || `${partnerName} — photo ${i + 1}`}
              className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
