import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Heart } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  const [liked, setLiked] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <div className="group cursor-pointer">
        {/* Image container with enhanced styling */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-md group-hover:shadow-xl transition-shadow duration-200 ring-1 ring-border/50">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/40" />
            </div>
          )}
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          
          {/* Experience count badge - Apple style */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/20 backdrop-blur-xl text-white shadow-sm tracking-wide">
              {itinerary.experiences?.length || 0} experiences
            </span>
          </div>
        </div>

        {/* Text content below image */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-[15px] line-clamp-1 text-foreground flex-1">
              {itinerary.name}
            </h3>
            <button
              onClick={handleLikeClick}
              className="shrink-0 p-1 -m-1 hover:scale-110 transition-transform"
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-colors",
                  liked ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-foreground"
                )} 
              />
            </button>
          </div>
          
          <p className="text-[13px] text-muted-foreground truncate">
            {itinerary.experiences?.[0]?.location || "Curated itinerary"}
          </p>
        </div>
      </div>
    </Link>
  );
};
