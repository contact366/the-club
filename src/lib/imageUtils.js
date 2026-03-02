/**
 * Shared image utility for normalizing URLs and providing fallback images.
 */

export const PLACEHOLDER_IMAGE = '/gastronomie.jpg';

/**
 * Normalizes an image URL:
 * - Returns null for null/undefined/empty/non-string values
 * - Converts protocol-relative URLs (//...) to https://...
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

/**
 * Returns a valid image src, falling back to placeholder when the URL is
 * absent or invalid.
 */
export function getImageSrc(url, placeholder = PLACEHOLDER_IMAGE) {
  return normalizeImageUrl(url) || placeholder;
}
