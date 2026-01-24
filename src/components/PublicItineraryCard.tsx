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
      <Card className="overflow-hidden rounded-2xl bg-[hsl(220_13%_12%)] border border-[hsl(220_10%_18%)] hover:border-[hsl(220_10%_24%)] transition-all duration-150 group cursor-pointer shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30">
        {/* Cover Image with inner padding */}
        <div className="p-2 pb-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            {itinerary.coverImage ? (
              <img 
                src={itinerary.coverImage} 
                alt={itinerary.name}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-xl">
                <Layers className="w-10 h-10 text-primary/40" />
              </div>
            )}
            
            {/* Trending badge */}
            {socialData.isTrending && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-primary/90 text-primary-foreground">
                  Trending
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content - Clean like Polymarket */}
        <div className="p-4 pt-3 space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-[15px] line-clamp-2 text-foreground leading-snug">
            {itinerary.name}
          </h3>
          
          {/* Meta */}
          <p className="text-[13px] text-muted-foreground/80">
            {itinerary.experiences?.length || 0} experiences
          </p>
          
          {/* Stats row */}
          <div className="flex items-center justify-between pt-3 mt-1">
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
