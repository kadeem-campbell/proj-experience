import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomeCarousel {
  id: string;
  name: string;
  slug: string;
  contentType: "itinerary" | "experience";
  displayOrder: number;
  cityId: string | null;
  itemIds: string[];
}

export const useHomeCarousels = () => {
  return useQuery({
    queryKey: ["home-carousels"],
    queryFn: async (): Promise<HomeCarousel[]> => {
      const { data: collections, error } = await (supabase as any)
        .from("collections")
        .select("id, name, slug, content_type, home_display_order, city_id")
        .eq("show_on_home", true)
        .eq("is_active", true)
        .order("home_display_order");

      if (error || !collections) return [];

      // Fetch linked items for each collection
      const collectionIds = collections.map((c: any) => c.id);

      // Get experience links
      const { data: expLinks } = await (supabase as any)
        .from("collection_experiences")
        .select("collection_id, experience_id")
        .in("collection_id", collectionIds);

      // Get itinerary links via collection_items
      const { data: itinLinks } = await (supabase as any)
        .from("collection_items")
        .select("collection_id, item_id")
        .eq("item_type", "itinerary")
        .in("collection_id", collectionIds);

      const expByCollection: Record<string, string[]> = {};
      (expLinks || []).forEach((l: any) => {
        if (!expByCollection[l.collection_id]) expByCollection[l.collection_id] = [];
        expByCollection[l.collection_id].push(l.experience_id);
      });

      const itinByCollection: Record<string, string[]> = {};
      (itinLinks || []).forEach((l: any) => {
        if (!itinByCollection[l.collection_id]) itinByCollection[l.collection_id] = [];
        itinByCollection[l.collection_id].push(l.item_id);
      });

      return collections.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        contentType: c.content_type || "itinerary",
        displayOrder: c.home_display_order || 0,
        cityId: c.city_id,
        itemIds:
          c.content_type === "experience"
            ? expByCollection[c.id] || []
            : itinByCollection[c.id] || [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
