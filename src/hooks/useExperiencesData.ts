import { useMemo } from "react";
import { publicItinerariesData } from "@/data/itinerariesData";
import { useDbExperiences } from "@/hooks/useDbExperiences";

// Import experience images (fallbacks for when DB has no thumbnail)
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

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
}

// Fallback mock data for when DB is unavailable
const fallbackExperiences: Experience[] = [
  { id: "7", title: "Zanzibar Sea Walk", creator: "ChristineNampeera", views: "25K", videoThumbnail: beachImage, category: "Adventure", location: "Zanzibar", price: "$45" },
  { id: "1", title: "Jet Ski Adventure", creator: "JohnDoe", views: "5000", videoThumbnail: jetskiImage, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", category: "Water Sports", location: "Dar Es Salaam", price: "$49" },
  { id: "2", title: "Beach Party Extravaganza", creator: "BeachVibes", views: "12.5K", videoThumbnail: partyImage, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", category: "Party", location: "Zanzibar", price: "$35" },
  { id: "3", title: "Safari Wildlife Experience", creator: "WildlifePro", views: "8.2K", videoThumbnail: wildlifeImage, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", category: "Wildlife", location: "Serengeti", price: "$120" },
  { id: "4", title: "Local Food Tasting Tour", creator: "FoodieGuide", views: "6.7K", videoThumbnail: foodImage, category: "Food", location: "Stone Town", price: "$25" },
  { id: "5", title: "Tropical Beach Paradise", creator: "BeachLover", views: "15.3K", videoThumbnail: beachImage, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", category: "Beach", location: "Kendwa", price: "$40" },
  { id: "6", title: "Mountain Climbing Adventure", creator: "AdventureSeeker", views: "4.1K", videoThumbnail: adventureImage, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", category: "Adventure", location: "Mount Kilimanjaro", price: "$200" },
];

// Static itinerary-generated experiences (pre-computed once)
let cachedItineraryExperiences: Experience[] | null = null;
const getItineraryExperiences = (): Experience[] => {
  if (cachedItineraryExperiences) return cachedItineraryExperiences;
  cachedItineraryExperiences = publicItinerariesData.flatMap(itinerary =>
    itinerary.experiences.map(exp => ({
      id: exp.id,
      title: exp.title,
      creator: exp.creator,
      views: "0",
      videoThumbnail: exp.videoThumbnail,
      videoUrl: "",
      category: exp.category,
      location: exp.location,
      price: exp.price,
    }))
  );
  return cachedItineraryExperiences;
};

// Pre-computed static data for non-hook access (backward compat)
export const allExperiences = (() => {
  const all = [...fallbackExperiences, ...getItineraryExperiences()];
  return all.filter((exp, index, self) => index === self.findIndex(e => e.id === exp.id));
})();

// Hook that merges DB experiences with fallback data
export const useExperiencesData = () => {
  const { data: dbExperiences, isLoading } = useDbExperiences();

  return useMemo(() => {
    if (!dbExperiences || dbExperiences.length === 0) {
      return allExperiences;
    }

    // Convert DB experiences to Experience interface
    const dbMapped: Experience[] = dbExperiences.map(db => ({
      id: db.id,
      title: db.title,
      creator: db.creator,
      views: db.views,
      videoThumbnail: db.video_thumbnail,
      videoUrl: db.video_url,
      category: db.category,
      location: db.location,
      price: db.price,
    }));

    // DB experiences take priority, then add itinerary-generated ones not in DB
    const dbTitles = new Set(dbMapped.map(e => e.title.toLowerCase()));
    const itineraryExtras = getItineraryExperiences().filter(
      e => !dbTitles.has(e.title.toLowerCase())
    );

    const merged = [...dbMapped, ...itineraryExtras];
    return merged.filter((exp, index, self) => index === self.findIndex(e => e.id === exp.id));
  }, [dbExperiences]);
};
