import { useMemo } from "react";
import { useProducts, useDestinations } from "@/hooks/useProducts";

export interface Experience {
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
}

/** @deprecated Use useProducts() directly for new code */
export const allExperiences: Experience[] = [];

/**
 * Returns products mapped to the legacy Experience interface.
 * This is the single source of truth — queries the products table.
 */
export const useExperiencesData = () => {
  const { data: products = [] } = useProducts();
  const { data: destinations = [] } = useDestinations();

  return useMemo(() => {
    if (products.length === 0) return [];

    const destMap = new Map(destinations.map(d => [d.id, d.name]));

    return products.map(p => ({
      id: p.id,
      title: p.title,
      creator: "",
      views: String(p.view_count || 0),
      videoThumbnail: p.cover_image || "",
      videoUrl: p.video_url || undefined,
      category: "",
      location: destMap.get(p.destination_id || "") || "",
      price: "",
      slug: p.slug,
    }));
  }, [products, destinations]);
};
