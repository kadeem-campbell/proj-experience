// Utility functions for SEO-friendly URL slugs

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateExperienceUrl = (_location: string, title: string, slug?: string): string => {
  const resolvedSlug = (slug || '').trim() || slugify(title);
  return `/experiences/${resolvedSlug}`;
};

export const generateExperienceSlug = (title: string): string => {
  return slugify(title);
};

export const parseExperienceSlug = (slug: string): { title: string } => {
  return {
    title: slug.replace(/-/g, ' ')
  };
};
