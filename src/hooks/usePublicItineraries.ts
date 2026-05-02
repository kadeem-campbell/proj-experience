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

const dedupe = (experiences: LikedExperience[]): LikedExperience[] => {
  const seen = new Set<string>();
  return experiences.filter((e) => {
    if (!e?.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
};

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

  const itineraryIds = data.map((row: any) => row.id);

  // 1) Read snapshots from the canonical public_itinerary_items table.
  const itemsByItinerary: Record<string, LikedExperience[]> = {};
  if (itineraryIds.length > 0) {
    const { data: snapshotItems } = await supabase
      .from("public_itinerary_items")
      .select("*")
      .in("public_itinerary_id", itineraryIds)
      .order("day_number", { ascending: true })
      .order("display_order", { ascending: true });

    // Resolve product/poi metadata for any item lacking a denormalized title/image.
    const productIds = new Set<string>();
    const poiIds = new Set<string>();
    (snapshotItems || []).forEach((it: any) => {
      if (it.entity_type === "product" && it.entity_id) productIds.add(it.entity_id);
      if (it.entity_type === "poi" && it.entity_id) poiIds.add(it.entity_id);
    });

    const productMeta: Record<string, any> = {};
    if (productIds.size > 0) {
      const ids = Array.from(productIds);
      for (let i = 0; i < ids.length; i += 100) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, title, slug, cover_image, video_url, location, category, price")
          .in("id", ids.slice(i, i + 100));
        (prods || []).forEach((p: any) => (productMeta[p.id] = p));
      }
    }
    const poiMeta: Record<string, any> = {};
    if (poiIds.size > 0) {
      const ids = Array.from(poiIds);
      for (let i = 0; i < ids.length; i += 100) {
        const { data: pois } = await supabase
          .from("pois")
          .select("id, name, slug, cover_image, location, category")
          .in("id", ids.slice(i, i + 100));
        (pois || []).forEach((p: any) => (poiMeta[p.id] = p));
      }
    }

    (snapshotItems || []).forEach((it: any) => {
      const meta =
        it.entity_type === "product"
          ? productMeta[it.entity_id]
          : it.entity_type === "poi"
            ? poiMeta[it.entity_id]
            : null;
      const id =
        it.entity_id ||
        `custom-${it.id}`;
      const exp = {
        id,
        title: meta?.title || meta?.name || it.title || it.custom_title || "",
        creator: "",
        videoThumbnail: meta?.cover_image || it.image_url || "",
        category: meta?.category || it.category || "",
        location: meta?.location || it.location || "",
        price: meta?.price || it.price || "",
        likedAt: new Date().toISOString(),
        notes: it.notes || undefined,
        timeSlot: (it.time_slot as TimeSlot) || undefined,
        slug: meta?.slug || undefined,
      } as LikedExperience;
      if (!itemsByItinerary[it.public_itinerary_id]) {
        itemsByItinerary[it.public_itinerary_id] = [];
      }
      itemsByItinerary[it.public_itinerary_id].push(exp);
    });
  }

  // 2) Legacy fallback: editorial rows that still only have JSONB experiences.
  const legacyProductIds = new Set<string>();
  data.forEach((row: any) => {
    if (itemsByItinerary[row.id]?.length) return;
    const exps = Array.isArray(row.experiences) ? row.experiences : [];
    exps.forEach((e: any) => {
      if (e?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(e.id)) {
        legacyProductIds.add(e.id);
      }
    });
  });

  const legacyProductMeta: Record<string, any> = {};
  if (legacyProductIds.size > 0) {
    const ids = Array.from(legacyProductIds);
    for (let i = 0; i < ids.length; i += 100) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, slug, cover_image, location, category, price")
        .in("id", ids.slice(i, i + 100));
      (prods || []).forEach((p: any) => (legacyProductMeta[p.id] = p));
    }
  }

  return data.map((row: any) => {
    let experiences = itemsByItinerary[row.id] || [];

    if (experiences.length === 0) {
      // Legacy editorial JSONB fallback (only products).
      const rawExps = Array.isArray(row.experiences) ? row.experiences : [];
      experiences = rawExps
        .filter((e: any) => e?.id && legacyProductMeta[e.id])
        .map((e: any) => {
          const product = legacyProductMeta[e.id];
          return {
            id: e.id,
            title: product?.title || e.title || "",
            creator: e.creator || "",
            videoThumbnail: product?.cover_image || e.videoThumbnail || "",
            category: product?.category || e.category || "",
            location: product?.location || e.location || "",
            price: product?.price || e.price || "",
            likedAt: e.likedAt || new Date().toISOString(),
            slug: product?.slug || e.slug || "",
          } as LikedExperience;
        });
    }

    return {
      id: row.slug || row.id,
      dbId: row.id,
      name: row.name,
      slug: row.slug,
      experiences: dedupe(experiences),
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
