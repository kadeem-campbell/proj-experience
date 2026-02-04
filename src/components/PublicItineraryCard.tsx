import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Heart } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  const [liked, setLiked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  // Get all images from experiences
  const images = itinerary.experiences?.map(exp => exp.videoThumbnail).filter(Boolean) || [];
  const allImages = itinerary.coverImage 
    ? [itinerary.coverImage, ...images.slice(0, 5)] 
    : images.slice(0, 6);
  
  const hasMultipleImages = allImages.length > 1;
  const experienceCount = itinerary.experiences?.length || 0;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

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

  // Determine correct link - public itineraries go to /public-itinerary, user's own go to /trip
  const linkPath = itinerary.isPublic ? `/public-itinerary/${itinerary.id}` : `/trip/${itinerary.id}`;

  return (
    <Link to={linkPath}>
      <div 
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container - TikTok square ratio on mobile, 3:2 on desktop */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-muted",
          isMobile ? "aspect-[4/5]" : "aspect-[3/2]"
        )}>
          {allImages.length > 0 ? (
            <img 
              src={isMobile ? allImages[0] : allImages[currentIndex]} 
              alt={itinerary.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/40" />
            </div>
          )}

          {/* Heart button - always visible, Vision Pro style */}
          <button
            onClick={handleLikeClick}
            className="absolute top-3 left-3 p-2 rounded-full bg-white/60 backdrop-blur-2xl shadow-sm border border-white/30 transition-transform duration-200 hover:scale-110"
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
                liked ? "fill-destructive text-destructive" : "text-neutral-700"
              )} 
            />
          </button>

          {/* Experience count badge - always visible */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/60 backdrop-blur-2xl shadow-sm border border-white/30 flex items-center gap-1">
            <Layers className="w-3 h-3 text-neutral-700" />
            <span className="text-xs font-medium text-neutral-700">{experienceCount}</span>
          </div>

          {/* Navigation arrows - Desktop only, Vision Pro style */}
          {!isMobile && hasMultipleImages && isHovered && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-2xl shadow-sm border border-white/30 flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-2xl shadow-sm border border-white/30 flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          {/* Pagination dots - Desktop only, Vision Pro style - hover only */}
          {!isMobile && hasMultipleImages && isHovered && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 backdrop-blur-2xl">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    idx === currentIndex 
                      ? "w-2 h-2 bg-neutral-800" 
                      : "w-1.5 h-1.5 bg-neutral-500"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text content below image */}
        <div className="mt-3 space-y-0.5">
          <h3 className="font-medium text-[15px] line-clamp-1 text-foreground">
            {itinerary.name}
          </h3>
          <p className="text-[13px] text-muted-foreground truncate">
            {itinerary.experiences?.[0]?.location || "Curated itinerary"}
          </p>
        </div>
      </div>
    </Link>
  );
};