import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layers, Heart } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  const [localLiked, setLocalLiked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;

  const images = itinerary.experiences?.map(exp => exp.videoThumbnail).filter(Boolean) || [];
  const allImages = itinerary.coverImage 
    ? [itinerary.coverImage, ...images.slice(0, 5)] 
    : images.slice(0, 6);
  
  const hasMultipleImages = allImages.length > 1;
  const experienceCount = itinerary.experiences?.length || 0;

  const handleLikeClick = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile && 'vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', {
        id: itinerary.id,
        name: itinerary.name,
        coverImage: itinerary.coverImage,
        creatorName: itinerary.creatorName,
        experiences: itinerary.experiences?.slice(0, 3)
      });
    } else {
      setLocalLiked(!localLiked);
    }
  }, [itinerary, isAuthenticated, toggleDbLike, localLiked, isMobile]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const linkPath = `/itineraries/${itinerary.id}`;

  return (
    <Link 
      to={linkPath}
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
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/2]">
          {/* Skeleton shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {allImages.length > 0 ? (
            <img 
              src={isMobile ? allImages[0] : allImages[currentIndex]} 
              alt={itinerary.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 ease-out",
                isHovered && "scale-[1.03]",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/40" />
            </div>
          )}

          {/* Heart button */}
          <button
            onClick={handleLikeClick}
            onTouchEnd={handleLikeClick}
            className={cn(
              "absolute top-2.5 left-2.5 p-2 rounded-full transition-all duration-200 active:scale-90",
              "bg-background/50 backdrop-blur-xl border border-border/20 shadow-sm",
              "hover:bg-background/70",
              liked && "bg-primary/15"
            )}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked ? "fill-primary text-primary scale-110" : "text-foreground/80"
              )} 
            />
          </button>

          {/* Experience count badge */}
          <div className={cn(
            "absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full flex items-center gap-1.5",
            "bg-background/50 backdrop-blur-xl border border-border/20 shadow-sm"
          )}>
            <Layers className="w-3 h-3 text-foreground/80" />
            <span className="text-xs font-medium text-foreground/80">{experienceCount}</span>
          </div>

          {/* Navigation arrows - Desktop only */}
          {!isMobile && hasMultipleImages && isHovered && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur-xl shadow-md border border-border/20 flex items-center justify-center hover:bg-background/80 transition-all duration-200 hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/80"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur-xl shadow-md border border-border/20 flex items-center justify-center hover:bg-background/80 transition-all duration-200 hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/80"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          {/* Pagination dots */}
          {!isMobile && hasMultipleImages && isHovered && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/40 backdrop-blur-xl">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    idx === currentIndex 
                      ? "w-2 h-2 bg-foreground/90" 
                      : "w-1.5 h-1.5 bg-foreground/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="mt-2.5 space-y-0.5">
          <h3 className="font-semibold text-[15px] line-clamp-1 text-foreground leading-snug">
            {itinerary.name}
          </h3>
          <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
            {experienceCount} {experienceCount === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      </div>
    </Link>
  );
};