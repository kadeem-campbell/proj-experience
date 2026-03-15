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
 * Generate experience/product URL.
 * New entity route: /things-to-do/{destination}/{product-slug}
 * Legacy fallback: /experiences/{slug}
 */
export const generateExperienceUrl = (location: string, title: string, slug?: string): string => {
  const resolvedSlug = (slug || '').trim() || slugify(title);

  // Try to map location to a destination slug
  if (location) {
    const destSlug = slugify(location.split(',')[0].trim());
    if (destSlug) {
      return `/things-to-do/${destSlug}/${resolvedSlug}`;
    }
  }

  // Fallback to legacy route
  return `/experiences/${resolvedSlug}`;
};

/**
 * Generate a product URL from structured entity data
 */
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
