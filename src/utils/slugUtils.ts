// Utility functions for SEO-friendly URL slugs

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a product URL using the canonical route system.
 * Pattern: /things-to-do/{destination}/{product-slug}
 */
export const generateExperienceUrl = (
  location: string,
  title: string,
  slug?: string,
  destinationOverride?: string,
): string => {
  const resolvedSlug = (slug || '').trim() || slugify(title);
  const explicitDestination = slugify(destinationOverride || '');
  if (explicitDestination) {
    return `/things-to-do/${explicitDestination}/${resolvedSlug}`;
  }

  const locationParts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const destinationSource = locationParts.length > 1 ? locationParts[locationParts.length - 1] : locationParts[0];
  const destinationSlug = slugify(destinationSource || '');

  if (destinationSlug) {
    return `/things-to-do/${destinationSlug}/${resolvedSlug}`;
  }

  return `/things-to-do/${resolvedSlug}`;
};

export const generateProductUrl = (destinationSlug: string, productSlug: string, areaSlug?: string): string => {
  if (areaSlug) {
    return `/things-to-do/${destinationSlug}/${areaSlug}/${productSlug}`;
  }
  return `/things-to-do/${destinationSlug}/${productSlug}`;
};

export const generateExperienceSlug = (title: string): string => {
  return slugify(title);
};

export const parseExperienceSlug = (slug: string): { title: string } => {
  return {
    title: slug.replace(/-/g, ' ')
  };
};
