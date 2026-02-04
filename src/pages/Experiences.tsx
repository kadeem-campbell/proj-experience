import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicItinerariesData } from "@/data/itinerariesData";
import { ArrowLeft, Search, Compass } from "lucide-react";

// Import experience images
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

const mockExperiences = [
  {
    id: "1",
    title: "Jet Ski Adventure",
    creator: "JohnDoe",
    views: "5000",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar Es Salaam",
    price: "$49"
  },
  {
    id: "2", 
    title: "Beach Party Extravaganza",
    creator: "BeachVibes",
    views: "12.5K",
    videoThumbnail: partyImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Party",
    location: "Zanzibar",
    price: "$35"
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    views: "8.2K", 
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Serengeti",
    price: "$120"
  },
  {
    id: "4",
    title: "Local Food Tasting Tour",
    creator: "FoodieGuide",
    views: "6.7K",
    videoThumbnail: foodImage,
    category: "Food",
    location: "Stone Town",
    price: "$25"
  },
  {
    id: "5",
    title: "Tropical Beach Paradise",
    creator: "BeachLover",
    views: "15.3K",
    videoThumbnail: beachImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Beach", 
    location: "Kendwa",
    price: "$40"
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    views: "4.1K",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Mount Kilimanjaro",
    price: "$200"
  }
];

// Combine mock experiences with all experiences from public itineraries
const getAllExperiences = () => {
  const itineraryExperiences = publicItinerariesData.flatMap(itinerary => 
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
  
  // Combine and deduplicate by id
  const allExperiences = [...mockExperiences, ...itineraryExperiences];
  const uniqueExperiences = allExperiences.filter((exp, index, self) => 
    index === self.findIndex(e => e.id === exp.id)
  );
  
  return uniqueExperiences;
};

const ExperiencesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const experiences = getAllExperiences();
  
  const filteredExperiences = experiences.filter((experience) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      experience.title.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q) ||
      experience.creator?.toLowerCase().includes(q)
    );
  });

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredExperiences.length) {
          setVisibleCount(prev => Math.min(prev + 12, filteredExperiences.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredExperiences.length]);

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary" />
              <h1 className="text-lg md:text-2xl font-bold">All Experiences</h1>
            </div>
            <span className="text-muted-foreground text-sm">({experiences.length})</span>
          </div>
          
          {/* Search */}
          <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md">
            <Search className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground mr-2 md:mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm md:text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {filteredExperiences.slice(0, visibleCount).map((experience) => (
              <ExperienceCard key={experience.id} {...experience} compact />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {visibleCount < filteredExperiences.length && (
            <div 
              ref={loadMoreRef}
              className="flex justify-center py-6 md:py-8"
            >
              <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {filteredExperiences.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">No experiences found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ExperiencesPage;