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
        .select("id, title, slug, cover_image, cover_image_url, video_url, destination_id, average_price_per_person, activity_type_id, destinations(name), activity_types(name)")
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
        videoThumbnail: p.cover_image || "",
        videoUrl: p.video_url || undefined,
        category: p.activity_types?.name || "",
        location: p.destinations?.name || "",
        price: p.average_price_per_person ? `$${p.average_price_per_person} avg` : "",
        slug: p.slug || undefined,
        destinationId: p.destination_id || null,
        averagePrice: p.average_price_per_person || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return data;
};
