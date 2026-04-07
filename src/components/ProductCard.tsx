import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { generateProductPageUrl } from "@/utils/slugUtils";

interface ProductCardProps {
  id: string;
  title: string;
  creator: string;
  views: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
  slug?: string;
  compact?: boolean;
}

export const ProductCard = ({
  id,
  title,
  creator,
  views,
  videoThumbnail,
  videoUrl,
  category,
  location,
  price,
  slug,
  compact = false,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current && videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isHovered, videoUrl]);

  const productData = {
    id, title, creator, videoThumbnail, category, location, price
  };

  const handleAddSuccess = () => {};

  return (
    <Link 
      to={generateProductPageUrl(location, title, slug)}
      className="touch-manipulation block"
    >
      <div 
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3]">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {videoUrl ? (
            <video
              ref={videoRef}
              poster={videoThumbnail}
              className={cn(
                "w-full h-full object-cover",
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
                "w-full h-full object-cover",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
          
          <div
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="absolute bottom-2.5 right-2.5"
          >
            <ItinerarySelector
              experienceId={id}
              experienceData={productData}
              onAdd={handleAddSuccess}
            >
              <button className={cn(
                "rounded-full flex items-center justify-center transition-all duration-150 active:scale-90",
                "w-8 h-8",
                "bg-black/30 backdrop-blur-xl border border-white/10",
              )}>
                <Plus className="w-4 h-4 text-white" />
              </button>
            </ItinerarySelector>
          </div>
        </div>

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