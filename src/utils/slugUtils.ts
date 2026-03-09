// Utility functions for SEO-friendly URL slugs

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateExperienceUrl = (location: string, title: string): string => {
  const locationSlug = slugify(location);
  const titleSlug = slugify(title);
  return `/experience/${locationSlug}/${titleSlug}`;
};

export const parseExperienceSlug = (locationSlug: string, titleSlug: string): { location: string; title: string } => {
  return {
    location: locationSlug.replace(/-/g, ' '),
    title: titleSlug.replace(/-/g, ' ')
  };
};
