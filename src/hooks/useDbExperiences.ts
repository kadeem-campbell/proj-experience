import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbExperience {
  id: string;
  title: string;
  slug: string;
  creator: string;
  description: string;
  category: string;
  location: string;
  price: string;
  duration: string;
  group_size: string;
  rating: number;
  weather: string;
  best_time: string;
  video_thumbnail: string;
  video_url: string;
  gallery: string[];
  highlights: string[];
  meeting_points: { name: string; type: string }[];
  faqs: { q: string; a: string; likes: number }[];
  tiktok_videos: { videoId: string; url: string; author: string }[];
  instagram_embed: string;
  social_links: Record<string, string>;
  views: string;
  like_count: number;
  view_count: number;
  destination_id: string | null;
  creator_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchExperiences = async (): Promise<DbExperience[]> => {
  const { data, error } = await supabase
    .from("experiences")
    .select("*, experience_faqs(*)")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch experiences:", error);
    return [];
  }

  return (data || []).map((row: any) => {
    const faqsFromTable = Array.isArray(row.experience_faqs) && row.experience_faqs.length > 0
      ? row.experience_faqs
          .filter((f: any) => f.is_active)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((f: any) => ({ q: f.question, a: f.answer, likes: 0 }))
      : null;
    const faqsFallback = Array.isArray(row.faqs) ? row.faqs : [];

    return {
      id: row.id,
      title: row.title,
      slug: row.slug || '',
      creator: row.creator,
      description: row.description || "",
      category: row.category,
      location: row.location,
      price: row.price || "",
      duration: row.duration || "",
      group_size: row.group_size || "",
      rating: Number(row.rating) || 4.7,
      weather: row.weather || "",
      best_time: row.best_time || "",
      video_thumbnail: row.video_thumbnail || "",
      video_url: row.video_url || "",
      gallery: Array.isArray(row.gallery) ? row.gallery : [],
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      meeting_points: Array.isArray(row.meeting_points) ? row.meeting_points : [],
      faqs: faqsFromTable || faqsFallback,
      tiktok_videos: Array.isArray(row.tiktok_videos) ? row.tiktok_videos : [],
      instagram_embed: row.instagram_embed || "",
      social_links: row.social_links && typeof row.social_links === "object" ? row.social_links : {},
      views: row.views || "0",
      like_count: row.like_count || 0,
      view_count: row.view_count || 0,
      destination_id: row.destination_id,
      creator_id: row.creator_id,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
};

export const useDbExperiences = () => {
  return useQuery({
    queryKey: ["db-experiences"],
    queryFn: fetchExperiences,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDbExperienceByTitle = (title: string) => {
  const { data: experiences, isLoading } = useDbExperiences();
  const experience = experiences?.find(
    (e) => e.title.toLowerCase() === title.toLowerCase()
  );
  return { experience, isLoading };
};
