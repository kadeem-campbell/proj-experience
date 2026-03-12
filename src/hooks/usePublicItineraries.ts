import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";

export interface PublicItinerary {
  id: string;
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

  if (error) {
    console.error("Failed to fetch public itineraries:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.slug || row.id,
    name: row.name,
    slug: row.slug,
    experiences: Array.isArray(row.experiences) ? row.experiences : (typeof row.experiences === 'string' ? JSON.parse(row.experiences) : []),
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
  }));
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
