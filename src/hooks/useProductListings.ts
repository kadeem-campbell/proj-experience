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
  priceMin?: number | null;
  priceMax?: number | null;
}

export const emptyProductListings: ProductListing[] = [];

/** Normalized listing data sourced exclusively from the products table */
export const useProductListings = () => {
  const { data = [] } = useQuery({
    queryKey: ["product-listings"],
    queryFn: async (): Promise<ProductListing[]> => {
      // Fetch products and price ranges in parallel
      const [productsRes, pricesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, title, slug, cover_image, cover_image_url, video_url, destination_id, primary_area_id, average_price_per_person, activity_type_id, destinations(name, slug), activity_types(name), areas!products_primary_area_id_fkey(slug)")
          .in("visibility_output_state", ["public", "public_indexed", "marketplace_active"] as any)
          .eq("publish_state", "published" as any),
        supabase
          .from("price_options")
          .select("option_id, amount, amount_max, options!inner(product_id)")
          .eq("is_active", true) as any,
      ]);

      if (productsRes.error) {
        console.error("Failed to fetch product listings:", productsRes.error);
        return [];
      }

      // Build price range map: product_id → { min, max }
      const priceMap: Record<string, { min: number; max: number }> = {};
      if (pricesRes.data) {
        for (const row of pricesRes.data as any[]) {
          const productId = row.options?.product_id;
          if (!productId) continue;
          const lo = row.amount || 0;
          const hi = row.amount_max || row.amount || 0;
          if (!priceMap[productId]) {
            priceMap[productId] = { min: lo, max: hi };
          } else {
            if (lo < priceMap[productId].min) priceMap[productId].min = lo;
            if (hi > priceMap[productId].max) priceMap[productId].max = hi;
          }
        }
      }

      return (productsRes.data || []).map((p: any) => {
        const range = priceMap[p.id];
        let priceStr = "";
        let avgPrice: number | null = null;

        if (p.average_price_per_person) {
          avgPrice = p.average_price_per_person;
          const lo = Math.round(avgPrice! * 0.8);
          const hi = Math.round(avgPrice! * 1.2);
          priceStr = `$${lo}–$${hi}`;
        } else if (range) {
          priceStr = range.min === range.max
            ? `$${Math.round(range.min)}`
            : `$${Math.round(range.min)}–$${Math.round(range.max)}`;
          avgPrice = (range.min + range.max) / 2;
        }

        return {
          id: p.id,
          title: p.title,
          creator: "",
          views: "0",
          videoThumbnail: p.cover_image_url || p.cover_image || "",
          videoUrl: p.video_url || undefined,
          category: p.activity_types?.name || "",
          location: p.destinations?.name || "",
          price: priceStr,
          slug: p.slug || undefined,
          destinationId: p.destination_id || null,
          destinationSlug: p.destinations?.slug || undefined,
          areaSlug: p.areas?.slug || null,
          averagePrice: avgPrice,
          priceMin: range?.min || null,
          priceMax: range?.max || null,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return data;
};
