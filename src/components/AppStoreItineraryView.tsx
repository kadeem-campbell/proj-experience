import { Link } from "react-router-dom";
import { Heart, Users, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Itinerary {
  id: string;
  name: string;
  coverImage: string;
  creatorName?: string;
  creatorAvatar?: string;
  experienceCount: number;
  dayCount: number;
  likes?: number;
  location?: string;
}

interface AppStoreItineraryViewProps {
  itineraries: Itinerary[];
}

export const AppStoreItineraryView = ({ itineraries }: AppStoreItineraryViewProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {itineraries.map((itinerary) => (
        <AppStoreItineraryCard key={itinerary.id} itinerary={itinerary} />
      ))}
    </div>
  );
};

const AppStoreItineraryCard = ({ itinerary }: { itinerary: Itinerary }) => {
  return (
    <Link 
      to={`/itineraries/${itinerary.id}`}
      className="block w-full"
    >
      <div className="relative w-full rounded-2xl overflow-hidden">
        {/* Image - tall aspect ratio like App Store */}
        <div className="relative aspect-[4/4.5] w-full">
          <img
            src={itinerary.coverImage}
            alt={itinerary.name}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <h2 className="text-xl font-bold text-white line-clamp-2">
              {itinerary.name}
            </h2>
            <p className="text-white/70 text-sm">{itinerary.experienceCount} experiences</p>
            
            {itinerary.location && (
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{itinerary.location}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              {/* Creator info */}
              {itinerary.creatorName && (
                <div className="flex items-center gap-2">
                  {itinerary.creatorAvatar && (
                    <img 
                      src={itinerary.creatorAvatar} 
                      alt={itinerary.creatorName}
                      className="w-6 h-6 rounded-full object-cover border border-white/30"
                    />
                  )}
                  <span className="text-white/70 text-sm">
                    by {itinerary.creatorName}
                  </span>
                </div>
              )}
              
              {/* Trip details */}
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{itinerary.dayCount} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AppStoreItineraryView;
