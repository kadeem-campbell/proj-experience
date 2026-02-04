import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { AppStoreItineraryView } from "@/components/AppStoreItineraryView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicItinerariesData, getPopularItineraries, getFaveItineraries } from "@/data/itinerariesData";
import { ArrowLeft, Search, Users, Heart, LayoutGrid, Layers, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ItinerariesPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');
  const isMobile = useIsMobile();
  
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
    if (filter === 'popular') return 'Most Popular';
    if (filter === 'fave') return 'Staff Picks';
    return 'All Itineraries';
  };

  const getIcon = () => {
    if (filter === 'fave') return <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
    return <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
  };

  // Transform itineraries for AppStoreItineraryView
  const transformedItineraries = filteredItineraries.map(it => ({
    id: it.id,
    name: it.name,
    coverImage: it.coverImage || 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400',
    creatorName: it.creatorName,
    creatorAvatar: undefined,
    experienceCount: it.experiences.length,
    dayCount: Math.ceil(it.experiences.length / 4) || 1,
    likes: undefined,
    location: it.experiences[0]?.location
  }));

  // Mobile App Store-style card view (scrollable)
  if (isMobile && viewMode === 'cards') {
    return (
      <div className="min-h-screen w-full bg-background overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight">{getTitle()}</h1>
                <p className="text-xs text-muted-foreground">{itineraries.length} itineraries</p>
              </div>
            </div>
            
            {/* Search - elegant styling matching FixedSearchHeader */}
            <div className="flex items-center bg-muted/60 border border-border/50 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-foreground/60 mr-2.5 shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search itineraries..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-foreground/50"
                style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Scrollable content */}
        <div className="pb-20">
          {searchQuery ? (
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {filteredItineraries.map((itinerary) => (
                  <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                ))}
              </div>
              {filteredItineraries.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No itineraries found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <AppStoreItineraryView itineraries={transformedItineraries} />
          )}
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h1 className="text-lg md:text-2xl font-bold">{getTitle()}</h1>
            </div>
            <span className="text-muted-foreground text-sm">({itineraries.length})</span>
          </div>
          
          {/* Search */}
          <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md">
            <Search className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground mr-2 md:mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search itineraries..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm md:text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {filteredItineraries.map((itinerary) => (
              <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>

          {filteredItineraries.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">No itineraries found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ItinerariesPage;
