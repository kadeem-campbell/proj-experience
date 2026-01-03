import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MapPin, Layers } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  // Get first location from experiences
  const location = itinerary.experiences[0]?.location || "Multiple locations";

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <Card className="overflow-hidden border-0 bg-card hover:bg-accent/10 transition-all duration-300 group cursor-pointer rounded-lg">
        {/* Cover Image - Square Aspect Ratio */}
        <div className="relative aspect-square overflow-hidden rounded-lg m-2 mb-0">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary/60" />
            </div>
          )}
          
          {/* Experience Count Overlay */}
          <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded-full">
            {itinerary.experiences.length} spots
          </div>
        </div>

        {/* Content */}
        <div className="p-3 pt-2">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {itinerary.name}
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            by {itinerary.creatorName}
          </p>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};