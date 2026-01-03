import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Layers } from "lucide-react";
import { Itinerary } from "@/hooks/useItineraries";

interface PublicItineraryCardProps {
  itinerary: Itinerary;
}

export const PublicItineraryCard = ({ itinerary }: PublicItineraryCardProps) => {
  // Get unique locations from experiences
  const locations = [...new Set(itinerary.experiences.map(e => e.location))].slice(0, 2);

  return (
    <Link to={`/public-itinerary/${itinerary.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
        {/* Cover Image */}
        <div className="relative h-40 overflow-hidden bg-muted">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="w-12 h-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          
          {/* Experience Count Badge */}
          <Badge 
            className="absolute top-3 right-3 bg-background/90 text-foreground backdrop-blur-sm"
          >
            {itinerary.experiences.length} experiences
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {itinerary.name}
          </h3>

          {/* Creator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <User className="w-3 h-3" />
            <span>by {itinerary.creatorName}</span>
          </div>

          {/* Locations */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {locations.join(', ')}
              {itinerary.experiences.length > 2 && ' +more'}
            </span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[...new Set(itinerary.experiences.map(e => e.category))].slice(0, 3).map(cat => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
