import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Heart } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateExperienceUrl } from "@/utils/slugUtils";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLiked: isLocalLiked, toggleLike: toggleLocalLike } = useLikedExperiences();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

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
    id, title, creator, videoThumbnail, category, location, price
  };

  const handleAddSuccess = () => {};

  const handleLikeClick = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile && 'vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(id, 'experience', experienceData);
    } else {
      toggleLocalLike(experienceData);
    }
  }, [id, isAuthenticated, experienceData, toggleDbLike, toggleLocalLike, isMobile]);

  return (
    <Link 
      to={generateExperienceUrl(location, title)}
      className="touch-manipulation block"
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div 
        className={cn(
          "group cursor-pointer transition-transform duration-150 ease-out",
          isPressed && isMobile && "scale-[0.98]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3]">
          {/* Skeleton shimmer while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 ease-out",
                isHovered && "scale-[1.03]",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              muted
              loop
              playsInline
              onLoadedData={() => setImageLoaded(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={videoThumbnail}
              alt={title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 ease-out",
                isHovered && "scale-[1.03]",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}

          {/* Heart button */}
          <button
            onClick={handleLikeClick}
            onTouchEnd={handleLikeClick}
            className={cn(
              "absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90",
              "bg-white/15 backdrop-blur-2xl border border-white/20 shadow-lg",
              "hover:bg-white/25",
              liked && "bg-white/25"
            )}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked ? "fill-primary text-primary scale-110" : "text-white/90"
              )} 
            />
          </button>
          
          {/* Add to Itinerary */}
          <div
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="absolute bottom-2.5 right-2.5"
          >
            <ItinerarySelector
              experienceId={id}
              experienceData={experienceData}
              onAdd={handleAddSuccess}
            >
              <button className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                "bg-white/15 backdrop-blur-2xl border border-white/20 shadow-lg",
                "hover:bg-white/25"
              )}>
                <Plus className="w-4 h-4 text-white/90" />
              </button>
            </ItinerarySelector>
          </div>
        </div>

        {/* Text content */}
        <div className="mt-2.5 space-y-0.5">
          <h3 className={cn(
            "font-semibold line-clamp-1 text-foreground leading-snug",
            compact ? "text-sm" : "text-[15px]"
          )}>
            {title}
          </h3>
          <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
            {location}
          </p>
          {price && (
            <p className="text-[13px] text-muted-foreground/70">
              <span className="font-medium text-foreground">{price}</span> typical
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};