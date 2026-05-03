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
  const productMeta: Record<string, any> = {};
  // Collect product ids referenced by JSONB experiences fallback so we can enrich them
  const jsonbProductIds = new Set<string>();
  data.forEach((row: any) => {
    if (Array.isArray(row.experiences)) {
      row.experiences.forEach((e: any) => {
        if (e?.id && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(e.id)) jsonbProductIds.add(e.id);
      });
    }
  });
  if (itineraryIds.length > 0) {
    const { data: snapshotItems } = await supabase
      .from("public_itinerary_items")
      .select("*")
      .in("public_itinerary_id", itineraryIds)
      .order("day_number", { ascending: true })
      .order("display_order", { ascending: true });

    // Resolve product/poi metadata for any item lacking denormalized fields.
    const productIds = new Set<string>();
    const poiIds = new Set<string>();
    (snapshotItems || []).forEach((it: any) => {
      if (it.entity_type === "product" && it.entity_id) productIds.add(it.entity_id);
      if (it.entity_type === "poi" && it.entity_id) poiIds.add(it.entity_id);
    });

    const allProductIds = new Set<string>([...productIds, ...jsonbProductIds]);
    if (allProductIds.size > 0) {
      const ids = Array.from(allProductIds);
      for (let i = 0; i < ids.length; i += 100) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, title, slug, cover_image, cover_image_url, video_url, average_price_per_person, destinations(name, slug), activity_types(name), areas!products_primary_area_id_fkey(slug)")
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
        videoThumbnail: meta?.cover_image_url || meta?.cover_image || it.image_url || "",
        category: meta?.activity_types?.name || meta?.category || it.category || "",
        location: meta?.destinations?.name || meta?.location || it.location || "",
        price: meta?.average_price_per_person ? `$${Math.round(meta.average_price_per_person)} avg` : (it.price || ""),
        likedAt: new Date().toISOString(),
        notes: it.notes || undefined,
        timeSlot: (it.time_slot as TimeSlot) || undefined,
        slug: meta?.slug || undefined,
        entityType: it.entity_type === "poi" ? "poi" : "product",
        entityId: it.entity_id || undefined,
        destinationSlug: meta?.destinations?.slug || undefined,
        areaSlug: meta?.areas?.slug || undefined,
      } as LikedExperience;
      if (!itemsByItinerary[it.public_itinerary_id]) {
        itemsByItinerary[it.public_itinerary_id] = [];
      }
      itemsByItinerary[it.public_itinerary_id].push(exp);
    });
  }

  return data.map((row: any) => {
    let experiences = itemsByItinerary[row.id] || [];
    // Fallback: hydrate from row.experiences JSONB if snapshot table is empty
    if (experiences.length === 0 && Array.isArray(row.experiences) && row.experiences.length > 0) {
      experiences = row.experiences
        .map((e: any) => {
          const meta = e?.id ? (productMeta as any)[e.id] : null;
          if (!meta && !e?.title) return null;
          return {
            id: e.id,
            title: meta?.title || e.title || "",
            creator: e.creator || "",
            videoThumbnail: meta?.cover_image_url || meta?.cover_image || e.videoThumbnail || e.image_url || "",
            category: meta?.activity_types?.name || e.category || "",
            location: meta?.destinations?.name || e.location || "",
            price: meta?.average_price_per_person ? `$${Math.round(meta.average_price_per_person)} avg` : (e.price || ""),
            likedAt: e.likedAt || new Date().toISOString(),
            notes: e.notes,
            timeSlot: e.timeSlot,
            slug: meta?.slug || e.slug,
            entityType: "product",
            entityId: e.id,
            destinationSlug: meta?.destinations?.slug,
            areaSlug: meta?.areas?.slug,
          } as LikedExperience;
        })
        .filter(Boolean) as LikedExperience[];
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
