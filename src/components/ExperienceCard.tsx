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
          "relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 cursor-pointer group transition-all duration-150",
          "hover:border-border hover:bg-card/80"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden">
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
            <div className="absolute top-3 left-3">
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

        {/* Content - Clean & minimal like Polymarket */}
        <div className="p-4 space-y-3">
          {/* Title row */}
          <h3 className={cn(
            "font-semibold line-clamp-2 leading-snug text-foreground",
            compact ? "text-sm" : "text-[15px]"
          )}>
            {title}
          </h3>
          
          {/* Meta row */}
          <p className="text-[13px] text-muted-foreground">
            {location}
          </p>
          
          {/* Bottom row - Price & Activity */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
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
