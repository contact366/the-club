/**
 * Generates a URL-friendly slug from a partner name and address.
 * Example: generatePartnerSlug("Lou Pantail", "107 Av. Saint-Lambert, 06100 Nice") → "lou-pantail-nice"
 */
export function generatePartnerSlug(name, address) {
  const city = extractCity(address);
  const base = `${name} ${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
  return base;
}

function extractCity(address) {
  if (!address) return '';
  // Try to match city after postal code (e.g., "06100 Nice" → "Nice")
  const postalMatch = address.match(/\d{5}\s+([A-Za-zÀ-ÿ-]+(?:\s+[A-Za-zÀ-ÿ-]+)*)\s*$/);
  if (postalMatch) return postalMatch[1];
  // Fallback: last comma-separated part
  const parts = address.split(',');
  return parts[parts.length - 1].trim().replace(/^\d{5}\s*/, '');
}
