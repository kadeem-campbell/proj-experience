import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Layers, Users, TrendingUp, Copy } from "lucide-react";
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
    const isPopular = participants > 400;
    return { participants, copies, isTrending, isPopular };
  }, [itinerary.id]);

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <Card className="overflow-hidden border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-150 group cursor-pointer rounded-xl">
        {/* Cover Image with overlays */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Layers className="w-8 md:w-10 h-8 md:h-10 text-primary/60" />
            </div>
          )}
          
          {/* Top left badge */}
          {socialData.isTrending && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            </div>
          )}
          
          {/* Activity indicator */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/80 backdrop-blur-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live))] animate-pulse" />
              {socialData.participants} viewing
            </span>
          </div>

          {/* Experience count badge */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-background/90 backdrop-blur-sm text-foreground">
              {itinerary.experiences?.length || 0} experiences
            </span>
          </div>
        </div>

        {/* Content - Enhanced social feel */}
        <div className="p-3">
          <h3 className="font-semibold text-xs md:text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-tight">
            {itinerary.name}
          </h3>
          
          {/* Social stats bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {socialData.participants}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <Copy className="w-3 h-3" />
                {socialData.copies}
              </span>
            </div>
            {socialData.isPopular && (
              <span className="text-[10px] font-medium text-[hsl(var(--success))]">
                Popular
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
