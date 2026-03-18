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
}

export const emptyProductListings: ProductListing[] = [];

/** Normalized listing data sourced exclusively from the products table */
export const useProductListings = () => {
  const { data = [] } = useQuery({
    queryKey: ["product-listings"],
    queryFn: async (): Promise<ProductListing[]> => {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, slug, cover_image, video_url, duration, destination_id, like_count, view_count, tier")
        .eq("is_active", true);

      if (error) {
        console.error("Failed to fetch product listings:", error);
        return [];
      }

      return (products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        creator: "",
        views: String(p.view_count || 0),
        videoThumbnail: p.cover_image || "",
        videoUrl: p.video_url || undefined,
        category: "",
        location: "",
        price: "",
        slug: p.slug || undefined,
        destinationId: p.destination_id || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return data;
};
