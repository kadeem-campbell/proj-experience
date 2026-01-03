import { useState, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useItineraries } from "@/hooks/useItineraries";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  const { isInItinerary, addExperience, removeExperience } = useItineraries();
  const { toast } = useToast();

  const inItinerary = isInItinerary(id);

  useEffect(() => {
    if (isHovered && videoRef.current && videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isHovered, videoUrl]);

  const handleToggleItinerary = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (inItinerary) {
      removeExperience(id);
      toast({
        title: "Removed from itinerary",
        description: `${title} has been removed`,
      });
    } else {
      addExperience({
        id,
        title,
        creator,
        videoThumbnail,
        category,
        location,
        price
      });
      toast({
        title: "Added to itinerary",
        description: `${title} has been added to your trip`,
      });
    }
  };

  return (
    <Link to={`/experience/${id}`}>
      <Card 
        className={cn(
          "relative overflow-hidden rounded-lg bg-card border-0 cursor-pointer group transition-all duration-300",
          "hover:bg-accent/10 hover:shadow-lg"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail - Square Aspect Ratio for Album Look */}
        <div className="relative aspect-square overflow-hidden rounded-lg m-2 mb-0">
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          
          {/* Add to Itinerary Button - Shows on Hover */}
          <button
            onClick={handleToggleItinerary}
            className={cn(
              "absolute bottom-2 right-2 p-2.5 rounded-full shadow-lg transition-all duration-200",
              "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
              inItinerary 
                ? "bg-primary text-primary-foreground" 
                : "bg-primary text-primary-foreground hover:scale-110"
            )}
          >
            {inItinerary ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content - Compact Info */}
        <div className="p-3 pt-2">
          <h3 className={cn(
            "font-semibold line-clamp-1 mb-1",
            compact ? "text-sm" : "text-base"
          )}>
            {title}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-1">
            {creator} • {location}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{category}</span>
            <span className="text-sm font-semibold text-primary">{price}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};