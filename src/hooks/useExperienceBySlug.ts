import { useQuery } from "@tanstack/react-query";

/**
 * @deprecated `experiences` is no longer a live entity. Use `useProductBySlug` from
 * `@/hooks/useProducts` instead. This hook now always returns null and exists only so
 * legacy admin/archive code paths don't break their imports.
 */
export const useExperienceBySlug = (_slug: string) => {
  return useQuery({
    queryKey: ["experience-by-slug-deprecated"],
    queryFn: async () => null,
    enabled: false,
  });
};
