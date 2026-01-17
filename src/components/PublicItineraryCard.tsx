import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <Card className="overflow-hidden border-0 bg-card hover:bg-accent/10 transition-colors duration-150 group cursor-pointer rounded-lg p-2">
        {/* Cover Image - Square Aspect Ratio */}
        <div className="relative aspect-square overflow-hidden rounded-md">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/60" />
            </div>
          )}
        </div>

        {/* Content - Just title, Spotify style */}
        <div className="pt-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {itinerary.name}
          </h3>
        </div>
      </Card>
    </Link>
  );
};
