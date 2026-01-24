import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    const participants = Math.abs(hash % 500) + 20;
    const isTrending = Math.abs(hash % 10) < 3;
    return { participants, isTrending };
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
      <Card 
        className={cn(
          "relative overflow-hidden rounded-2xl bg-[hsl(220_13%_12%)] border border-[hsl(220_10%_18%)] cursor-pointer group transition-all duration-150 shadow-lg shadow-black/20",
          "hover:border-[hsl(220_10%_24%)] hover:shadow-xl hover:shadow-black/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail with inner padding for separation */}
        <div className="p-2 pb-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            {videoUrl ? (
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
            ) : (
              <img
                src={videoThumbnail}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
              />
            )}
            
            {/* Trending badge - minimal */}
            {socialData.isTrending && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-primary/90 text-primary-foreground">
                  Trending
                </span>
              </div>
            )}
            
            {/* Add to Itinerary Button - Shows on Hover */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className={cn(
                "absolute bottom-2 right-2 transition-all duration-100",
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
        </div>

        {/* Content - Clean & minimal like Polymarket */}
        <div className="p-4 pt-3 space-y-2">
          {/* Title row */}
          <h3 className={cn(
            "font-semibold line-clamp-2 leading-snug text-foreground",
            compact ? "text-sm" : "text-[15px]"
          )}>
            {title}
          </h3>
          
          {/* Meta row */}
          <p className="text-[13px] text-muted-foreground/80">
            {location}
          </p>
          
          {/* Bottom row - Price & Activity */}
          <div className="flex items-center justify-between pt-3 mt-1">
            <span className="text-[15px] font-semibold text-foreground">
              {price}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live))]" />
              {socialData.participants} planning
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
