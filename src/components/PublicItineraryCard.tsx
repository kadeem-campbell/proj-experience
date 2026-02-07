import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layers, Heart, ChevronLeft, ChevronRight } from "lucide-react";
// Make sure to import your types/hooks correctly
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
  const isMobile = useIsMobile();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(itinerary.id, "itinerary") : localLiked;

  // Images logic
  const images = itinerary.experiences?.map((exp) => exp.videoThumbnail).filter(Boolean) || [];
  const allImages = itinerary.coverImage ? [itinerary.coverImage, ...images.slice(0, 5)] : images.slice(0, 6);

  const hasMultipleImages = allImages.length > 1;
  const experienceCount = itinerary.experiences?.length || 0;

  const handleLikeClick = useCallback(
    async (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isMobile && "vibrate" in navigator) navigator.vibrate(10);

      if (isAuthenticated) {
        await toggleDbLike(itinerary.id, "itinerary", {
          id: itinerary.id,
          name: itinerary.name,
          coverImage: itinerary.coverImage,
          creatorName: itinerary.creatorName,
          experiences: itinerary.experiences?.slice(0, 3),
        });
      } else {
        setLocalLiked(!localLiked);
      }
    },
    [itinerary, isAuthenticated, toggleDbLike, localLiked, isMobile],
  );

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link
      to={`/public-itinerary/${itinerary.id}`}
      className="touch-manipulation block" // Ensure block display
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div
        className={cn(
          // SIZE CONTROL: Fixed width here makes it look like a story card
          "group cursor-pointer transition-transform duration-150 relative w-[160px] md:w-[220px]",
          isPressed && isMobile && "scale-[0.98]",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container - TALLER (3/4 ratio) for Story look */}
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4]">
          {allImages.length > 0 ? (
            <img
              src={isMobile ? allImages[0] : allImages[currentIndex]}
              alt={itinerary.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-8 h-8 text-primary/40" />
            </div>
          )}

          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Heart button */}
          <button
            onClick={handleLikeClick}
            onTouchEnd={handleLikeClick}
            className={cn(
              "absolute top-2 left-2 p-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 transition-all duration-200 active:scale-90",
              liked && "bg-destructive/20 border-destructive/20",
            )}
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-all duration-200",
                liked ? "fill-red-500 text-red-500 scale-110" : "text-white",
              )}
            />
          </button>

          {/* Experience count badge */}
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-white" />
            <span className="text-[10px] font-medium text-white">{experienceCount}</span>
          </div>

          {/* Navigation arrows - Smaller and simpler for small cards */}
          {!isMobile && hasMultipleImages && isHovered && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}

          {/* Pagination dots */}
          {!isMobile && hasMultipleImages && isHovered && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-full transition-all duration-200 shadow-sm",
                    idx === currentIndex ? "w-1.5 h-1.5 bg-white" : "w-1 h-1 bg-white/50",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text content - Now OUTSIDE the image for cleaner look, or you can put it inside like true Stories */}
        <div className="mt-2 space-y-0.5 px-0.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{itinerary.name}</h3>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground truncate">{itinerary.creatorName || "Curated"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};
