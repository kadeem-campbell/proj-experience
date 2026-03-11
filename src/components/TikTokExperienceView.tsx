import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { Heart, Plus, Check, MapPin, ChevronUp } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";

interface Experience {
  id: string;
  title: string;
  creator: string;
  views?: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
}

interface TikTokExperienceViewProps {
  experiences: Experience[];
}

export const TikTokExperienceView = ({ experiences }: TikTokExperienceViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Snap scroll detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < experiences.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, experiences.length]);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {experiences.map((experience, index) => (
        <TikTokCard 
          key={experience.id} 
          experience={experience} 
          isActive={index === currentIndex}
        />
      ))}
      
      {/* Scroll hint on first card */}
      {currentIndex === 0 && experiences.length > 1 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60 animate-bounce pointer-events-none z-10">
          <ChevronUp className="w-6 h-6" />
          <span className="text-xs">Swipe up</span>
        </div>
      )}
    </div>
  );
};

const TikTokCard = ({ experience, isActive }: { experience: Experience; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isInItinerary } = useItineraries();
  const { isLiked, toggleLike } = useLikedExperiences();
  const { toast } = useToast();

  const inItinerary = isInItinerary(experience.id);
  const liked = isLiked(experience.id);

  const experienceData = {
    id: experience.id,
    title: experience.title,
    creator: experience.creator,
    videoThumbnail: experience.videoThumbnail,
    category: experience.category,
    location: experience.location,
    price: experience.price
  };

  // Play/pause video based on visibility
  useEffect(() => {
    if (videoRef.current && experience.videoUrl) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, experience.videoUrl]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(experienceData);
  };

  const handleAddSuccess = () => {
    toast({
      title: "Added to itinerary",
      description: `${experience.title} has been added to your trip`,
    });
  };

  return (
    <div 
      className="h-full w-full snap-start snap-always relative flex-shrink-0"
      style={{ scrollSnapAlign: 'start' }}
    >
      <Link to={`/experience/${experience.id}`} className="block h-full w-full">
        {/* Full-screen media */}
        <div className="absolute inset-0 bg-black">
          {experience.videoUrl ? (
            <video
              ref={videoRef}
              poster={experience.videoThumbnail}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            >
              <source src={experience.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={experience.videoThumbnail}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-6">
          {/* Bottom info */}
          <div className="space-y-2 pr-16">
            <h2 className="text-xl font-bold text-white line-clamp-2">
              {experience.title}
            </h2>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {experience.category}
              </span>
              <span className="font-semibold text-white">{experience.price}</span>
            </div>
          </div>
        </div>

        {/* Right side action buttons */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
          {/* Like button */}
          <button
            onClick={handleLikeClick}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors",
                  liked ? "fill-destructive text-destructive" : "text-white"
                )} 
              />
            </div>
            <span className="text-white text-xs">Like</span>
          </button>

          {/* Add to itinerary button */}
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            {inItinerary ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-success/30 backdrop-blur-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <span className="text-white text-xs">Saved</span>
              </div>
            ) : (
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <div className="flex flex-col items-center gap-1 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-xs">Add</span>
                </div>
              </ItinerarySelector>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};