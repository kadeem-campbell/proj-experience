import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Check, Heart } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";

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
    toast({
      title: "Added to itinerary",
      description: `${title} has been added to your trip`,
    });
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
        {/* Image container with enhanced styling */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-md group-hover:shadow-xl transition-shadow duration-200 ring-1 ring-border/50">
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
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
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          )}
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          
          {/* Category tag - Apple style */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/20 backdrop-blur-xl text-white shadow-sm capitalize tracking-wide">
              {category}
            </span>
          </div>
          
          {/* Add to Itinerary Button - Shows on Hover */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className={cn(
              "absolute bottom-3 right-3 transition-all duration-100",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            {inItinerary ? (
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-lg">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <ItinerarySelector
                experienceId={id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <button className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </ItinerarySelector>
            )}
          </div>
        </div>

        {/* Text content below image */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn(
              "font-medium line-clamp-1 text-foreground flex-1",
              compact ? "text-sm" : "text-[15px]"
            )}>
              {title}
            </h3>
            <button
              onClick={handleLikeClick}
              className="shrink-0 p-1 -m-1 hover:scale-110 transition-transform"
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-colors",
                  liked ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-foreground"
                )} 
              />
            </button>
          </div>
          
          <p className="text-[13px] text-muted-foreground truncate">
            {location}
          </p>
        </div>
      </div>
    </Link>
  );
};
