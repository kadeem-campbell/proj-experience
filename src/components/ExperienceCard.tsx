import { useState, useRef, useEffect } from "react";
import { Plus, Check, Heart } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExperienceCardProps {
  id: string;
  title: string;
  creator: string;
  views: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
  compact?: boolean;
}

export const ExperienceCard = ({
  id,
  title,
  creator,
  views,
  videoThumbnail,
  videoUrl,
  category,
  location,
  price,
  compact = false,
}: ExperienceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isInItinerary } = useItineraries();
  const { isLiked, toggleLike } = useLikedExperiences();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const inItinerary = isInItinerary(id);
  const liked = isLiked(id);

  useEffect(() => {
    if (isHovered && videoRef.current && videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isHovered, videoUrl]);

  const experienceData = {
    id,
    title,
    creator,
    videoThumbnail,
    category,
    location,
    price
  };

  const handleAddSuccess = () => {
    // No toast - optimistic UI update only
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(experienceData);
  };

  return (
    <Link to={`/experience/${id}`}>
      <div 
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container - TikTok 4:5 ratio on mobile, square on desktop */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-muted",
          isMobile ? "aspect-[4/5]" : "aspect-square"
        )}>
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              muted
              loop
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={videoThumbnail}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          )}

          {/* Heart button - always visible, Vision Pro style */}
          <button
            onClick={handleLikeClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/60 backdrop-blur-2xl shadow-sm border border-white/30 transition-transform duration-200 hover:scale-110"
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
                liked ? "fill-destructive text-destructive" : "text-neutral-700"
              )} 
            />
          </button>
          
          {/* Add to Itinerary Button - Vision Pro style, always visible */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute bottom-2 right-2"
          >
            {inItinerary ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/70 backdrop-blur-2xl border border-white/30 shadow-sm">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <ItinerarySelector
                experienceId={id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/70 backdrop-blur-2xl border border-white/30 shadow-sm hover:bg-white/90 transition-colors">
                  <Plus className="w-4 h-4 text-neutral-700" />
                </button>
              </ItinerarySelector>
            )}
          </div>
        </div>

        {/* Text content below image */}
        <div className="mt-2 space-y-0.5">
          <h3 className={cn(
            "font-medium line-clamp-1 text-foreground",
            compact ? "text-sm" : "text-[15px]"
          )}>
            {title}
          </h3>
          <p className="text-[13px] text-muted-foreground truncate">
            {location}
          </p>
        </div>
      </div>
    </Link>
  );
};