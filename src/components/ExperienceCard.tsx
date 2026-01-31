import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Check, Heart } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
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
  const { toast } = useToast();

  const inItinerary = isInItinerary(id);

  // Generate consistent mock social data based on id
  const socialData = useMemo(() => {
    const hash = id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const likes = Math.abs(hash % 50000) + 500;
    const formattedLikes = likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes.toString();
    return { likes, formattedLikes };
  }, [id]);

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

  return (
    <Link to={`/experience/${id}`}>
      <div 
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                poster={videoThumbnail}
                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                muted
                loop
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
              
              {/* Unique Video Play Indicator - Corner triangle with pulse */}
              <div 
                className={cn(
                  "absolute top-0 left-0 transition-opacity duration-200",
                  isPlaying ? "opacity-0" : "opacity-100"
                )}
              >
                {/* Corner triangle background */}
                <div className="w-0 h-0 border-l-[48px] border-l-black/60 border-b-[48px] border-b-transparent" />
                {/* Play icon positioned in corner */}
                <div className="absolute top-2 left-2">
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-4 h-4 text-white fill-current"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
                {/* Subtle pulse ring */}
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full border border-white/40 animate-ping" 
                  style={{ animationDuration: '2s' }} 
                />
              </div>
            </>
          ) : (
            <img
              src={videoThumbnail}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
            />
          )}
          
          {/* Likes overlay at bottom left */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium drop-shadow-lg">
              <Heart className="w-4 h-4" />
              {socialData.formattedLikes}
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

        {/* Text content below image - TikTok style */}
        <div className="mt-3 space-y-1">
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
