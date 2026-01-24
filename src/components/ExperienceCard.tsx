import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Check, Users, TrendingUp, MessageCircle } from "lucide-react";
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
    const comments = Math.abs((hash * 7) % 50) + 5;
    const isTrending = Math.abs(hash % 10) < 3;
    const isHot = participants > 300;
    return { participants, comments, isTrending, isHot };
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
          "relative overflow-hidden rounded-xl bg-card border border-border/50 cursor-pointer group transition-all duration-150",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail with social overlays */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
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
              className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
            />
          )}
          
          {/* Top badges - Trending / Hot */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {socialData.isTrending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
            {socialData.isHot && !socialData.isTrending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--activity))] text-[hsl(var(--activity-foreground))]">
                🔥 Hot
              </span>
            )}
          </div>

          {/* Live activity indicator */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/80 backdrop-blur-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live))] animate-pulse" />
              {socialData.participants} planning
            </span>
          </div>
          
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
              <div className="p-2.5 rounded-full shadow-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <ItinerarySelector
                experienceId={id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <button className="p-2.5 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </button>
              </ItinerarySelector>
            )}
          </div>

          {/* Price badge */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-background/90 backdrop-blur-sm text-foreground shadow-sm">
              {price}
            </span>
          </div>
        </div>

        {/* Content - More vibrant and social */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              "font-semibold line-clamp-2 leading-tight",
              compact ? "text-xs md:text-sm" : "text-sm md:text-base"
            )}>
              {title}
            </h3>
          </div>
          
          <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 mb-2">
            {location} • {category}
          </p>
          
          {/* Social engagement bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {socialData.participants}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                {socialData.comments}
              </span>
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground">
              by {creator}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
