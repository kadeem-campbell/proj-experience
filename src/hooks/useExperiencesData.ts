import { useMemo } from "react";
import { useDbExperiences } from "@/hooks/useDbExperiences";

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
  cityId?: string | null;
}

/** @deprecated Use useDbExperiences() directly for new code */
export const allExperiences: Experience[] = [];

export const useExperiencesData = () => {
  const { data: experiences = [] } = useDbExperiences();

  return useMemo(() => {
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
    }));
  }, [experiences]);
};
