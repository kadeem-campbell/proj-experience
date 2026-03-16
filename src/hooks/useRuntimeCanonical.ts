/**
 * useRuntimeCanonical — resolves canonical URL from page_route_registry
 * before rendering SEO tags. Pages call this to enforce persistent canonical.
 */
import { useQuery } from '@tanstack/react-query';
import { resolveRuntimeCanonical, type RuntimeCanonical } from '@/services/canonicalRegistry';

export const useRuntimeCanonical = (entityType: string, entityId: string | undefined) => {
  return useQuery<RuntimeCanonical | null>({
    queryKey: ['runtime-canonical', entityType, entityId],
    queryFn: () => resolveRuntimeCanonical(entityType, entityId!),
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000,
  });
};
