import { useState, useRef, useEffect } from "react";
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
        {/* Image container - Square ratio */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
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

          {/* Heart button on image - shows on hover */}
          <button
            onClick={handleLikeClick}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
                liked ? "fill-destructive text-destructive" : "text-foreground"
              )} 
            />
          </button>
          
          {/* Add to Itinerary Button - Shows on Hover */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className={cn(
              "absolute bottom-2 right-2 transition-all duration-100",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            {inItinerary ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-lg">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <ItinerarySelector
                experienceId={id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <button className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg">
                  <Plus className="w-4 h-4" />
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