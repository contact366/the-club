"use client";
import Link from 'next/link';
import { getImageSrc, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

/**
 * Reusable establishment card – image-first, Airbnb-inspired.
 *
 * Props
 *   href        – link destination (required)
 *   name        – establishment name (required)
 *   image       – image URL (falls back to placeholder)
 *   city        – city or address shown below the image (optional)
 *   rating      – rating shown next to city (optional)
 *   offerLabel  – member offer badge text, e.g. "-20%" or "Offre exclusive" (optional)
 *   isMember    – when explicitly false, offer is shown blurred with a lock CTA (optional)
 */
export default function EstablishmentCard({ href, name, image, city, rating, offerLabel, isMember }) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      {/* 16:9 image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={getImageSrc(image)}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
        />
        {/* Subtle bottom-to-top gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
        {/* Establishment name overlaid at bottom-left */}
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{name}</h3>
        </div>
      </div>

      {/* Metadata below the image */}
      <div className="px-4 py-3 space-y-2">
        {(city || rating) && (
          <p className="text-sm text-gray-500 truncate">
            {city}{city && rating ? ' • ' : ''}{rating}
          </p>
        )}
        {offerLabel && (
          isMember === false ? (
            /* Non-member: blurred label + lock icon + unlock CTA */
            <div className="space-y-1">
              <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full blur-sm select-none pointer-events-none" aria-hidden="true">
                {offerLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3 h-3 text-amber-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[10px] font-semibold text-amber-700">
                  Unlock this offer with The Club
                </span>
              </div>
            </div>
          ) : (
            /* Member (or isMember not provided): full visibility */
            <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
              {offerLabel}
            </span>
          )
        )}
      </div>
    </Link>
  );
}
