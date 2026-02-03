import { Link } from "react-router-dom";
import { Layers, Heart } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";
import { useMemo } from "react";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  // Generate consistent mock social data based on id
  const socialData = useMemo(() => {
    const hash = itinerary.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const likes = Math.abs(hash % 30000) + 200;
    const formattedLikes = likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes.toString();
    return { likes, formattedLikes };
  }, [itinerary.id]);

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <div className="group cursor-pointer">
        {/* Image container with enhanced styling */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-md group-hover:shadow-xl transition-shadow duration-200 ring-1 ring-border/50">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
          
          {/* Likes overlay with glassmorphism */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg">
              <Heart className="w-3.5 h-3.5 text-white fill-white/90" />
              <span className="text-xs font-semibold text-white tracking-wide">
                {socialData.formattedLikes}
              </span>
            </div>
          </div>
          
          {/* Experience count badge with glassmorphism */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-black/30 backdrop-blur-md border border-white/10 text-white shadow-lg">
              {itinerary.experiences?.length || 0} experiences
            </span>
          </div>
        </div>

        {/* Text content below image - TikTok style */}
        <div className="mt-3 space-y-1.5">
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
