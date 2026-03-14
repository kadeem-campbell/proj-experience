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
  cityId?: string;
  creatorId?: string;
}

const fetchPublicItineraries = async (): Promise<PublicItinerary[]> => {
  const { data, error } = await supabase
    .from("public_itineraries")
    .select("*, creators(username, display_name), cities(name)")
    .eq("is_active", true)
    .order("like_count", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch public itineraries:", error);
    return [];
  }

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
    let jsonFallback: LikedExperience[] = [];

    if (Array.isArray(row.experiences)) {
      jsonFallback = row.experiences;
    } else if (typeof row.experiences === 'string') {
      try {
        const parsed = JSON.parse(row.experiences);
        jsonFallback = Array.isArray(parsed) ? parsed : [];
      } catch {
        jsonFallback = [];
      }
    }

    const linkedExperiences = linkedByItinerary[row.id] || [];

    return {
      id: row.slug || row.id,
      name: row.name,
      slug: row.slug,
      experiences: linkedExperiences.length > 0 ? linkedExperiences : jsonFallback,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isPublic: true,
      collaborators: [],
      creatorName: row.creators?.display_name || row.creators?.username || '',
      coverImage: row.cover_image || '',
      tag: row.tag as 'popular' | 'fave',
      likeCount: row.like_count || 0,
      viewCount: row.view_count || 0,
      cityId: row.city_id,
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
