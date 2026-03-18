import { useMemo } from "react";
import { useDbExperiences } from "@/hooks/useDbExperiences";

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

/** @deprecated Use useDbExperiences() directly for new code */
export const emptyProductListings: ProductListing[] = [];

/** Normalized listing data from the products/experiences source */
export const useProductListings = () => {
  const { data: experiences = [] } = useDbExperiences();

  return useMemo<ProductListing[]>(() => {
    if (experiences.length === 0) return [];

    return experiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      creator: exp.creator || "",
      views: exp.views || String(exp.view_count || 0),
      videoThumbnail: exp.video_thumbnail || "",
      videoUrl: exp.video_url || undefined,
      category: exp.category || "",
      location: exp.location || "",
      price: exp.price || "",
      slug: exp.slug || undefined,
      destinationId: exp.destination_id || null,
    }));
  }, [experiences]);
};
