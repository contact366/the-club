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
 */
export default function EstablishmentCard({ href, name, image, city, rating, offerLabel }) {
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
          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
            {offerLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
