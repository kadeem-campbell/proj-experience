import { useMemo } from "react";
import { useProducts, useDestinations, useAreas } from "@/hooks/useProducts";

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

export const useExperiencesData = () => {
  const { data: products = [] } = useProducts();
  const { data: destinations = [] } = useDestinations();
  const { data: areas = [] } = useAreas();

  return useMemo(() => {
    if (products.length === 0) return [];

    const destMap = new Map(destinations.map((d) => [d.id, d.name]));
    const areaMap = new Map(areas.map((a) => [a.id, a.name]));
    const destinationNames = destinations.map((d) => ({ slug: d.slug, name: d.name }));

    const inferDestinationName = (title: string, slug?: string) => {
      const haystack = `${title} ${slug || ""}`.toLowerCase();
      const match = destinationNames.find(
        (destination) =>
          haystack.startsWith(`${destination.slug}-`) ||
          haystack.startsWith(`${destination.name.toLowerCase()} `) ||
          haystack.includes(` ${destination.name.toLowerCase()} `)
      );
      return match?.name || "";
    };

    return products.map((product) => {
      const destinationName = destMap.get(product.destination_id || "") || inferDestinationName(product.title, product.slug);
      const areaName = areaMap.get(product.area_id || "");
      const location = [areaName, destinationName].filter(Boolean).join(", ");

      return {
        id: product.id,
        title: product.title,
        creator: "",
        views: String(product.view_count || 0),
        videoThumbnail: product.cover_image || "",
        videoUrl: product.video_url || undefined,
        category: "",
        location,
        price: "",
        slug: product.slug,
      };
    });
  }, [products, destinations, areas]);
};
