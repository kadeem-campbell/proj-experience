import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";

export interface PublicItinerary {
  id: string;
  dbId?: string;
  name: string;
  slug: string;
  experiences: LikedExperience[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  collaborators: string[];
  creatorName?: string;
  coverImage?: string;
  tag?: 'popular' | 'fave';
  likeCount?: number;
  viewCount?: number;
  destinationId?: string;
  creatorId?: string;
}

const fetchPublicItineraries = async (): Promise<PublicItinerary[]> => {
  const { data, error } = await supabase
    .from("public_itineraries")
    .select("*, creators(username, display_name)")
    .eq("is_active", true)
    .order("like_count", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch public itineraries:", error);
    return [];
  }

  // Collect all product IDs from JSONB experiences to enrich in one query
  const allProductIds = new Set<string>();
  data.forEach((row: any) => {
    const exps = Array.isArray(row.experiences) ? row.experiences : [];
    exps.forEach((e: any) => {
      if (e.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(e.id)) {
        allProductIds.add(e.id);
      }
    });
  });

  // Fetch product details for enrichment
  let productMap: Record<string, any> = {};
  if (allProductIds.size > 0) {
    const ids = Array.from(allProductIds);
    // Batch in chunks of 100
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { data: products } = await supabase
        .from("products")
        .select("id, title, slug, cover_image, video_url, destination_id")
        .in("id", chunk);
      if (products) {
        products.forEach((p: any) => { productMap[p.id] = p; });
      }
    }
  }

  // Also try the join table
  const itineraryIds = data.map((row: any) => row.id);
  let linkedByItinerary: Record<string, LikedExperience[]> = {};

  if (itineraryIds.length > 0) {
    const { data: linkedRows, error: linkedError } = await (supabase as any)
      .from("itinerary_experiences")
      .select("itinerary_id, display_order, notes, experiences(id, title, creator, video_thumbnail, category, location, price)")
      .in("itinerary_id", itineraryIds)
      .order("display_order", { ascending: true });

    if (!linkedError && linkedRows) {
      linkedByItinerary = linkedRows.reduce((acc: Record<string, LikedExperience[]>, row: any) => {
        const exp = row.experiences;
        if (!exp) return acc;
        if (!acc[row.itinerary_id]) acc[row.itinerary_id] = [];
        acc[row.itinerary_id].push({
          id: exp.id,
          title: exp.title || "",
          creator: exp.creator || "",
          videoThumbnail: exp.video_thumbnail || "",
          category: exp.category || "",
          location: exp.location || "",
          price: exp.price || "",
          likedAt: new Date().toISOString(),
          notes: row.notes || undefined,
        });
        return acc;
      }, {});
    }
  }

  return data.map((row: any) => {
    // Build experiences from JSONB, enriched with product data
    let jsonExperiences: LikedExperience[] = [];
    const rawExps = Array.isArray(row.experiences) ? row.experiences : [];
    
    jsonExperiences = rawExps
      .filter((e: any) => e.id)
      .map((e: any) => {
        const product = productMap[e.id];
        return {
          id: e.id,
          title: product?.title || e.title || "",
          creator: e.creator || "",
          videoThumbnail: product?.cover_image_url || e.videoThumbnail || "",
          category: e.category || "",
          location: e.location || "",
          price: e.price || "",
          likedAt: e.likedAt || new Date().toISOString(),
          slug: product?.slug || e.slug || "",
        } as LikedExperience;
      });

    // Prefer join table if it has data, otherwise use enriched JSONB
    const linkedExperiences = linkedByItinerary[row.id] || [];
    const experiences = linkedExperiences.length > 0 ? linkedExperiences : jsonExperiences;

    return {
      id: row.slug || row.id,
      dbId: row.id,
      name: row.name,
      slug: row.slug,
      experiences,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isPublic: true,
      collaborators: [],
      creatorName: row.creators?.display_name || row.creators?.username || '',
      coverImage: row.cover_image || '',
      tag: row.tag as 'popular' | 'fave',
      likeCount: row.like_count || 0,
      viewCount: row.view_count || 0,
      destinationId: row.destination_id,
      creatorId: row.creator_id,
    };
  });
};

export const usePublicItineraries = () => {
  return useQuery({
    queryKey: ["public-itineraries"],
    queryFn: fetchPublicItineraries,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePopularItineraries = () => {
  const { data, ...rest } = usePublicItineraries();
  return { data: data?.filter(i => i.tag === 'popular') || [], ...rest };
};

export const useFaveItineraries = () => {
  const { data, ...rest } = usePublicItineraries();
  return { data: data?.filter(i => i.tag === 'fave') || [], ...rest };
};
