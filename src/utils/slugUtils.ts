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
  const titleSlug = slugify(title);
  return `/experiences/${titleSlug}`;
};

export const generateExperienceSlug = (title: string): string => {
  return slugify(title);
};

export const parseExperienceSlug = (slug: string): { title: string } => {
  return {
    title: slug.replace(/-/g, ' ')
  };
};
