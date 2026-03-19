import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrowseDestination {
  id: string;
  name: string;
  slug: string;
  cover_image: string;
  flag_svg_url: string | null;
}

export const useDestinations = () => {
  return useQuery({
    queryKey: ["browse-destinations"],
    queryFn: async (): Promise<BrowseDestination[]> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("id, name, slug, cover_image, flag_svg_url, country_id, countries!destinations_country_id_fkey(flag_svg_url)")
        .eq("is_active", true)
        .order("display_order");

      if (error) {
        console.error("Failed to fetch destinations:", error);
        return [];
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        cover_image: d.cover_image || "",
        flag_svg_url: d.flag_svg_url || d.countries?.flag_svg_url || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
