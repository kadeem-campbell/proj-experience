import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fallback hook to resolve legacy experiences by slug.
 * Used when no product match is found in ExperienceDetail.
 */
export const useExperienceBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["experience-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!slug,
  });
};
