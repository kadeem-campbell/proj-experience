import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomeCarousel {
  id: string;
  name: string;
  slug: string;
  contentType: "itinerary" | "product" | "poi";
  displayOrder: number;
  destinationIds: string[]; // multi-city
  itemIds: string[];
}

export const useHomeCarousels = () => {
  return useQuery({
    queryKey: ["home-carousels"],
    queryFn: async (): Promise<HomeCarousel[]> => {
      const { data: collections, error } = await (supabase as any)
        .from("collections")
        .select("id, name, slug, content_type, home_display_order, destination_id")
        .eq("show_on_home", true)
        .eq("is_active", true)
        .order("home_display_order", { ascending: true });

      if (error || !collections) return [];

      const collectionIds = collections.map((c: any) => c.id);
      if (collectionIds.length === 0) return [];

      // Fetch multi-city assignments
      const { data: cdLinks } = await (supabase as any)
        .from("collection_destinations")
        .select("collection_id, destination_id")
        .in("collection_id", collectionIds);

      // Get collection_items (itineraries, pois, products)
      const { data: itemLinks } = await (supabase as any)
        .from("collection_items")
        .select("collection_id, item_id, item_type, position")
        .in("collection_id", collectionIds)
        .order("position");

      const destByCollection: Record<string, string[]> = {};
      (cdLinks || []).forEach((l: any) => {
        if (!destByCollection[l.collection_id]) destByCollection[l.collection_id] = [];
        destByCollection[l.collection_id].push(l.destination_id);
      });

      const itemsByCollection: Record<string, Record<string, string[]>> = {};
      (itemLinks || []).forEach((l: any) => {
        if (!itemsByCollection[l.collection_id]) itemsByCollection[l.collection_id] = {};
        const type = l.item_type || 'itinerary';
        if (!itemsByCollection[l.collection_id][type]) itemsByCollection[l.collection_id][type] = [];
        itemsByCollection[l.collection_id][type].push(l.item_id);
      });

      return collections.map((c: any) => {
        const contentType = c.content_type || "itinerary";
        let itemIds: string[] = [];

        if (contentType === "product") {
          itemIds = itemsByCollection[c.id]?.['product'] || [];
        } else if (contentType === "poi") {
          itemIds = itemsByCollection[c.id]?.['poi'] || [];
        } else {
          itemIds = itemsByCollection[c.id]?.['itinerary'] || [];
        }

        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          contentType,
          displayOrder: c.home_display_order ?? 999,
          destinationIds: destByCollection[c.id] || [],
          itemIds,
        };
      }).sort((a, b) => a.displayOrder - b.displayOrder);
    },
    staleTime: 30 * 1000, // 30s — ensures admin changes reflect quickly
    refetchOnWindowFocus: true,
  });
};
