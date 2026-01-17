import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicItinerariesData, getPopularItineraries, getFaveItineraries } from "@/data/itinerariesData";
import { ArrowLeft, Search, Users, Heart } from "lucide-react";

const ItinerariesPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const [searchQuery, setSearchQuery] = useState("");
  
  const getItineraries = () => {
    if (filter === 'popular') return getPopularItineraries();
    if (filter === 'fave') return getFaveItineraries();
    return publicItinerariesData;
  };

  const itineraries = getItineraries();
  
  const filteredItineraries = itineraries.filter((itinerary) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      itinerary.name.toLowerCase().includes(q) ||
      itinerary.creatorName?.toLowerCase().includes(q)
    );
  });

  const getTitle = () => {
    if (filter === 'popular') return 'Most Popular Itineraries';
    if (filter === 'fave') return 'Our Faves';
    return 'All Itineraries';
  };

  const getIcon = () => {
    if (filter === 'fave') return <Heart className="w-6 h-6 text-primary" />;
    return <Users className="w-6 h-6 text-primary" />;
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h1 className="text-2xl font-bold">{getTitle()}</h1>
            </div>
            <span className="text-muted-foreground">({itineraries.length})</span>
          </div>
          
          {/* Search */}
          <div className="flex items-center bg-muted rounded-full px-4 py-2 max-w-md">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search itineraries..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredItineraries.map((itinerary) => (
              <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>

          {filteredItineraries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No itineraries found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ItinerariesPage;
