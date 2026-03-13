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
}

/** @deprecated DB is the single source of truth – use useExperiencesData() hook */
export const allExperiences: Experience[] = [];

// Hook that returns DB experiences only
export const useExperiencesData = () => {
  const { data: dbExperiences, isLoading } = useDbExperiences();

  return useMemo(() => {
    if (!dbExperiences || dbExperiences.length === 0) return [];

    return dbExperiences.map(db => ({
      id: db.id,
      title: db.title,
      creator: db.creator,
      views: db.views,
      videoThumbnail: db.video_thumbnail,
      videoUrl: db.video_url,
      category: db.category,
      location: db.location,
      price: db.price,
      slug: db.slug,
    }));
  }, [dbExperiences]);
};
