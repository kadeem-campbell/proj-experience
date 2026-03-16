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

export const usePoiProducts = (poiId: string) => {
  return useQuery({
    queryKey: ["poi-products", poiId],
    queryFn: async () => {
      // Get product IDs linked to this POI
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

export const usePoiExperiences = (poiId: string, destinationId: string | null) => {
  return useQuery({
    queryKey: ["poi-experiences", poiId, destinationId],
    queryFn: async () => {
      // Get experiences linked via location name match or same area
      // First try product_pois for linked products, then get their legacy experiences
      const { data: poiData } = await supabase
        .from("pois")
        .select("name, area_id, destination_id")
        .eq("id", poiId)
        .single();

      if (!poiData) return [];

      // Find experiences whose location contains the POI name
      const { data: exps } = await supabase
        .from("experiences")
        .select("*")
        .eq("is_active", true)
        .ilike("location", `%${poiData.name}%`);

      return exps || [];
    },
    enabled: !!poiId,
  });
};
