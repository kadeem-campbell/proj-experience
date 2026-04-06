import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Poi {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  poi_type: string | null;
  cover_image: string | null;
  latitude: number | null;
  longitude: number | null;
  destination_id: string | null;
  area_id: string | null;
  is_active: boolean;
  is_public_page: boolean;
  google_place_id: string | null;
  wikidata_id: string | null;
  opening_hours_json: Record<string, string> | null;
}

export const usePoiBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["poi", slug],
    queryFn: async (): Promise<Poi | null> => {
      const { data, error } = await supabase
        .from("pois")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as Poi;
    },
    enabled: !!slug,
  });
};

export const usePoiMedia = (poiId: string) => {
  return useQuery({
    queryKey: ["poi-media", poiId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("entity_id", poiId)
        .eq("entity_type", "poi")
        .eq("is_active", true)
        .order("display_order");
      if (error) return [];
      return data || [];
    },
    enabled: !!poiId,
  });
};

export const usePoiProducts = (poiId: string) => {
  return useQuery({
    queryKey: ["poi-products", poiId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("product_pois")
        .select("product_id, relationship_type, products(*)")
        .eq("poi_id", poiId);
      if (error || !links) return [];
      return links
        .map((l: any) => l.products)
        .filter(Boolean)
        .filter((p: any) => p.is_active);
    },
    enabled: !!poiId,
  });
};
