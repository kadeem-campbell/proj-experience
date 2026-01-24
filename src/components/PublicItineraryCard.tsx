import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";
import { useMemo } from "react";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  // Generate consistent mock social data based on id
  const socialData = useMemo(() => {
    const hash = itinerary.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const participants = Math.abs(hash % 800) + 50;
    const copies = Math.abs((hash * 3) % 200) + 10;
    const isTrending = Math.abs(hash % 8) < 2;
    return { participants, copies, isTrending };
  }, [itinerary.id]);

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <Card className="overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 hover:border-border hover:bg-card/80 transition-all duration-150 group cursor-pointer">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/40" />
            </div>
          )}
          
          {/* Trending badge */}
          {socialData.isTrending && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-primary/90 text-primary-foreground">
                Trending
              </span>
            </div>
          )}
        </div>

        {/* Content - Clean like Polymarket */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-[15px] line-clamp-2 text-foreground leading-snug">
            {itinerary.name}
          </h3>
          
          {/* Meta */}
          <p className="text-[13px] text-muted-foreground">
            {itinerary.experiences?.length || 0} experiences
          </p>
          
          {/* Stats row */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-[13px] text-muted-foreground">
              {socialData.copies} copies
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live))]" />
              {socialData.participants} viewing
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
