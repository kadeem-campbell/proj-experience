import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead, createWebsiteJsonLd } from "@/components/SEOHead";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ProductCard } from "@/components/ProductCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { MobileHomeView } from "@/components/MobileHomeView";
import { useItineraries } from "@/hooks/useItineraries";
import { usePopularItineraries } from "@/hooks/usePublicItineraries";

import { Input } from "@/components/ui/input";
import { BrowseDestination } from "@/hooks/useDestinations";
import { useDestinations } from "@/hooks/useDestinations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProductListings } from "@/hooks/useProductListings";
import { useHomeCarousels } from "@/hooks/useHomeCarousels";
import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/utils/slugUtils";
import { Compass, Map, MapPinned, ChevronLeft, ChevronRight, Search as SearchIcon, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Spotify-style Desktop Scroll Row ────────────────────────────
const DesktopScrollRow = ({ 
  title, 
  onViewAll,
  children 
}: { 
  title: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => { if (el) el.removeEventListener('scroll', checkScroll); };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mb-8 group/row relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Show all
          </button>
        )}
      </div>
      
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
        )}

        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="inline-flex gap-4" style={{ minWidth: '100%' }}>
            {children}
          </div>
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-muted"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Desktop Search Bar (inline, Spotify-style) ──────────────────
const DesktopSearchBar = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  destinations,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCity: BrowseDestination | null;
  onCitySelect: (city: BrowseDestination | null) => void;
  destinations: BrowseDestination[];
}) => {
  const [cityOpen, setCityOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 mb-8">
      {/* City filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onCitySelect(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
            !selectedCity 
              ? "bg-foreground text-background" 
              : "bg-muted text-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
        {destinations.map((d) => (
          <button
            key={d.id}
            onClick={() => onCitySelect(selectedCity?.id === d.id ? null : d)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedCity?.id === d.id 
                ? "bg-foreground text-background" 
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            {d.flag_svg_url && <img src={d.flag_svg_url} className="w-4 h-4 rounded-full" alt="" />}
            {d.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative ml-auto min-w-[240px]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="What do you want to explore?"
          className="pl-9 pr-9 h-10 rounded-full bg-muted border-0 text-sm focus-visible:ring-1 focus-visible:ring-border"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── POI Card for desktop ────────────────────────────────────────
const DesktopPoiCard = ({ poi, destinationSlug }: { poi: any; destinationSlug?: string }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="flex-shrink-0 w-[200px] cursor-pointer group"
      onClick={() => navigate(`/things-to-do/${destinationSlug || 'explore'}/${poi.slug}`)}
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        {poi.cover_image ? (
          <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-bold line-clamp-2 leading-tight">{poi.name}</p>
          <p className="text-white/60 text-xs font-medium mt-0.5 capitalize">{poi.poi_type}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Synonym map for search ──────────────────────────────────────
const synonyms: Record<string, string[]> = {
  Party: ["party","nightlife","club","rave","dance","bar","drinks","lounge","cocktail"],
  "Water Sports": ["water sports","jet ski","kayak","surf","snorkel","dive","boat","sail","paddle"],
  Beach: ["beach","sun","sand","ocean","coast","tropical","island","seaside"],
  Food: ["food","eat","dine","restaurant","cuisine","street food","tasting","chef","culinary"],
  Wildlife: ["wildlife","safari","animal","nature","reserve","park","bird","jungle"],
  Adventure: ["adventure","hike","trek","zipline","climb","mountain","explore","extreme"],
  Culture: ["culture","museum","art","heritage","history","temple","monument","festival"],
  Wellness: ["wellness","spa","massage","yoga","meditation","retreat","relax"],
};

const SCROLL_STORAGE_KEY = "discover_scroll_position";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<BrowseDestination | null>(null);
  const { data: allDestinations = [] } = useDestinations();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const experiences = useProductListings();
  const { data: popularItinerariesForSearch = [] } = usePopularItineraries();
  const { data: allItinerariesData = [] } = usePublicItineraries();
  const { data: homeCarousels = [] } = useHomeCarousels();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { activeItinerary, experienceCount } = useItineraries();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Fetch POIs
  const { data: pois = [] } = useQuery({
    queryKey: ["desktop-pois"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pois")
        .select("id, name, slug, poi_type, cover_image, destination_id")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Sync city from URL
  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam && allDestinations.length > 0) {
      const found = allDestinations.find(d => d.name.toLowerCase() === cityParam.toLowerCase() || d.slug === cityParam.toLowerCase());
      if (found) setSelectedCity(found);
    } else if (!cityParam) {
      setSelectedCity(null);
    }
  }, [searchParams, allDestinations]);

  const handleCitySelect = (city: BrowseDestination | null) => { setSelectedCity(city); setSelectedCategory(null); };

  const selectedDestId = selectedCity?.id || null;
  const selectedCityName = selectedCity?.name || '';
  const destSlug = selectedCityName ? slugify(selectedCityName) : '';

  // Filter experiences/products by city (use destinationId for products, location string for legacy)
  const cityFilteredExperiences = useMemo(() => {
    if (!selectedCity) return experiences;
    return experiences.filter(e => 
      e.destinationId === selectedCity.id || 
      e.location?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );
  }, [experiences, selectedCity]);

  // Filter itineraries by city
  const cityFilteredItineraries = useMemo(() => {
    if (!selectedCity) return allItinerariesData;
    const cityName = selectedCity.name.toLowerCase();
    return allItinerariesData.filter(it => {
      return it.name.toLowerCase().includes(cityName) || 
        it.experiences?.some((e: any) => e.location?.toLowerCase().includes(cityName));
    });
  }, [allItinerariesData, selectedCity]);

  // Search filter
  const normalizeText = (text: string) => text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return cityFilteredExperiences.filter(e => {
      const fields = [e.title, e.location, e.category, e.creator].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => fields.includes(term));
    });
  }, [searchQuery, cityFilteredExperiences]);

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return cityFilteredItineraries.filter(it => {
      const fields = [it.name, it.creatorName].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => fields.includes(term));
    });
  }, [searchQuery, cityFilteredItineraries]);

  // Build carousel rows from homeCarousels (same as mobile)
  const carouselRows = useMemo(() => {
    return homeCarousels.filter((carousel) => {
      if (carousel.destinationIds.length === 0) return true;
      if (!selectedDestId) return true;
      return carousel.destinationIds.includes(selectedDestId);
    });
  }, [homeCarousels, selectedDestId]);

  const hasSearchResults = searchQuery.trim().length > 0;

  // On mobile: "/" shows homepage, "/search" shows search overlay
  const isSearchRoute = window.location.pathname === '/search' || window.location.pathname === '/discover';
  
  useEffect(() => {
    if (isMobile && isSearchRoute) setSearchQuery("");
  }, [isSearchRoute, isMobile]);
  
  if (isMobile && isSearchRoute) return (
    <MobileSearchOverlay
      isOpen={true}
      onClose={() => navigate(-1)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearch={(q) => setSearchQuery(q)}
    />
  );

  if (isMobile) return (
    <>
      <SEOHead
        title="Discover Experiences & Things to Do in East Africa"
        description="Explore curated experiences, activities and things to do in Zanzibar, Kilimanjaro, Nairobi and across East Africa."
        canonicalPath="/"
        indexability="public_indexed"
        jsonLd={createWebsiteJsonLd()}
      />
      <MobileHomeView />
    </>
  );

  return (
    <MainLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCity={selectedCity} onCitySelect={handleCitySelect}>
      <SEOHead
        title="Discover Experiences & Things to Do"
        description="Explore curated experiences, activities and things to do."
        canonicalPath="/"
        indexability="public_indexed"
        jsonLd={createWebsiteJsonLd()}
      />

      <div className="px-6 lg:px-10 py-6 max-w-[1600px]">
        {/* Spotify-style filter bar */}
        <DesktopSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          destinations={allDestinations}
        />

        {hasSearchResults ? (
          /* ─── Search Results ─────────────────────────────── */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Results for "{searchQuery}"
              </h2>
              <button onClick={() => setSearchQuery("")} className="text-sm font-medium text-primary">Clear</button>
            </div>

            {filteredItineraries.length > 0 && (
              <DesktopScrollRow title="Itineraries">
                {filteredItineraries.slice(0, 8).map((it) => (
                  <div key={it.id} className="flex-shrink-0 w-[280px]">
                    <PublicItineraryCard itinerary={it} />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {filteredExperiences.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Experiences</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {filteredExperiences.slice(0, 20).map((exp) => (
                    <ProductCard key={exp.id} {...exp} compact />
                  ))}
                </div>
              </div>
            )}

            {filteredExperiences.length === 0 && filteredItineraries.length === 0 && (
              <div className="text-center py-20">
                <SearchIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No results found</p>
              </div>
            )}
          </div>
        ) : (
          /* ─── Collection-Driven Carousels ────────────────── */
          <>
            {carouselRows.length > 0 ? (
              (() => {
                const elements: React.ReactNode[] = [];

                // POI row for selected city at position 2
                const poiRow = selectedDestId ? (() => {
                  const cityPois = pois.filter((p: any) => p.destination_id === selectedDestId);
                  if (cityPois.length === 0) return null;
                  return (
                    <DesktopScrollRow key="pois" title={`Places to explore in ${selectedCityName}`} onViewAll={() => navigate(`/${destSlug}`)}>
                      {cityPois.slice(0, 12).map((poi: any) => (
                        <DesktopPoiCard key={poi.id} poi={poi} destinationSlug={destSlug} />
                      ))}
                    </DesktopScrollRow>
                  );
                })() : null;

                carouselRows.forEach((carousel, idx) => {
                  if (idx === 2 && poiRow) elements.push(poiRow);

                  const title = carousel.name.replace('{city}', selectedCityName || 'your city');
                  const resolvedSlug = carousel.slug.replace('city', selectedCityName ? slugify(selectedCityName) : 'city');

                  if (carousel.contentType === 'itinerary') {
                    const items = carousel.itemIds.length > 0
                      ? cityFilteredItineraries.filter(it => carousel.itemIds.includes((it as any).dbId || it.id))
                      : cityFilteredItineraries.slice(0, 8);
                    if (items.length === 0) return;
                    elements.push(
                      <DesktopScrollRow key={carousel.id} title={title} onViewAll={() => navigate(`/collections/${resolvedSlug}`)}>
                        {items.slice(0, 10).map((it) => (
                          <div key={it.id} className="flex-shrink-0 w-[260px] lg:w-[280px]">
                            <PublicItineraryCard itinerary={it} />
                          </div>
                        ))}
                      </DesktopScrollRow>
                    );
                  } else if (carousel.contentType === 'product') {
                    const items = carousel.itemIds.length > 0
                      ? cityFilteredExperiences.filter(exp => carousel.itemIds.includes(exp.id))
                      : cityFilteredExperiences.slice(0, 10);
                    if (items.length === 0) return;
                    elements.push(
                      <DesktopScrollRow key={carousel.id} title={title} onViewAll={() => navigate(`/collections/${resolvedSlug}`)}>
                        {items.slice(0, 12).map((exp) => (
                          <div key={exp.id} className="flex-shrink-0 w-[220px] lg:w-[240px]">
                            <ProductCard {...exp} compact />
                          </div>
                        ))}
                      </DesktopScrollRow>
                    );
                  }
                });

                if (carouselRows.length < 3 && poiRow) elements.push(poiRow);
                return <>{elements}</>;
              })()
            ) : null}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SearchPage;
