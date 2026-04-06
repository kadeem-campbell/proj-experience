import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductListing {
  id: string;
  title: string;
  creator: string;
  views: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
  slug?: string;
  destinationId?: string | null;
  destinationSlug?: string;
  areaSlug?: string | null;
  averagePrice?: number | null;
}

export const emptyProductListings: ProductListing[] = [];

/** Normalized listing data sourced exclusively from the products table */
export const useProductListings = () => {
  const { data = [] } = useQuery({
    queryKey: ["product-listings"],
    queryFn: async (): Promise<ProductListing[]> => {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, slug, cover_image, cover_image_url, video_url, destination_id, primary_area_id, average_price_per_person, activity_type_id, destinations(name, slug), activity_types(name), areas!products_primary_area_id_fkey(slug)")
        .in("visibility_output_state", ["public", "public_indexed", "marketplace_active"] as any)
        .eq("publish_state", "published" as any);

      if (error) {
        console.error("Failed to fetch product listings:", error);
        return [];
      }

      return (products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        creator: "",
        views: "0",
        videoThumbnail: p.cover_image_url || p.cover_image || "",
        videoUrl: p.video_url || undefined,
        category: p.activity_types?.name || "",
        location: p.destinations?.name || "",
        price: p.average_price_per_person ? `$${Math.round(p.average_price_per_person * 0.8)}–$${Math.round(p.average_price_per_person * 1.2)}` : "",
        slug: p.slug || undefined,
        destinationId: p.destination_id || null,
        destinationSlug: p.destinations?.slug || undefined,
        areaSlug: p.areas?.slug || null,
        averagePrice: p.average_price_per_person || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return data;
};
