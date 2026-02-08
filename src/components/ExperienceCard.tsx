import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Heart } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
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
  const [isPressed, setIsPressed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLiked: isLocalLiked, toggleLike: toggleLocalLike } = useLikedExperiences();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Use database likes for authenticated users, localStorage for guests
  const liked = isAuthenticated ? isDbLiked(id, 'experience') : isLocalLiked(id);

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

  const handleLikeClick = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (isAuthenticated) {
      await toggleDbLike(id, 'experience', experienceData);
    } else {
      toggleLocalLike(experienceData);
    }
  }, [id, isAuthenticated, experienceData, toggleDbLike, toggleLocalLike, isMobile]);

  return (
    <Link 
      to={`/experience/${id}`}
      className="touch-manipulation"
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div 
        className={cn(
          "group cursor-pointer transition-transform duration-150",
          isPressed && isMobile && "scale-[0.98]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container - 4:3 ratio per Airbnb reference */}
        <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[4/3]">
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

          {/* Heart button - always visible, Vision Pro style with haptic feedback */}
          <button
            onClick={handleLikeClick}
            onTouchEnd={handleLikeClick}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full bg-background/60 backdrop-blur-2xl shadow-sm border border-border/30 transition-all duration-200 active:scale-90",
              liked && "bg-destructive/20"
            )}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked ? "fill-destructive text-destructive scale-110" : "text-foreground/70"
              )} 
            />
          </button>
          
          {/* Add to Itinerary Button - always show + to allow adding to multiple itineraries */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="absolute bottom-2 right-2"
          >
            <ItinerarySelector
              experienceId={id}
              experienceData={experienceData}
              onAdd={handleAddSuccess}
            >
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-background/70 backdrop-blur-2xl border border-border/30 shadow-sm hover:bg-background/90 transition-colors">
                <Plus className="w-4 h-4 text-foreground/70" />
              </button>
            </ItinerarySelector>
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
          <div className="flex items-center justify-between gap-1">
            <p className="text-[13px] text-muted-foreground truncate flex-1">
              {location}
            </p>
            {price && (
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                ~{price}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};