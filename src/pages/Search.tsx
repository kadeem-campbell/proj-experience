import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead, createWebsiteJsonLd } from "@/components/SEOHead";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ProductCard } from "@/components/ProductCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { FixedSearchHeader } from "@/components/FixedSearchHeader";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { MobileHomeView } from "@/components/MobileHomeView";
import { useItineraries } from "@/hooks/useItineraries";
import { usePopularItineraries } from "@/hooks/usePublicItineraries";

import { Button } from "@/components/ui/button";
import { City, cities as browseDataCities } from "@/data/browseData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProductListings } from "@/hooks/useProductListings";
import { Compass, Map, MapPinned, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const discoverySlides = [
  {
    icon: Compass,
    title: "Discover experiences",
    subtitle: "Find the best things to do in your city",
    colorClass: "bg-experience-color",
    textClass: "text-experience-color",
    bgClass: "bg-experience-color/10",
    ctas: [{ label: "Find Experiences", primary: true, route: "/things-to-do" }],
  },
  {
    icon: Map,
    title: "Explore itineraries",
    subtitle: "Plan your perfect trip with local guides",
    colorClass: "bg-itinerary-color",
    textClass: "text-itinerary-color",
    bgClass: "bg-itinerary-color/10",
    ctas: [{ label: "Explore Itineraries", primary: true, route: "/itineraries" }],
  },
  {
    icon: MapPinned,
    title: "Create an itinerary",
    subtitle: "Build and share your own travel plans",
    colorClass: "bg-social-color",
    textClass: "text-social-color",
    bgClass: "bg-social-color/10",
    ctas: [{ label: "Create Itinerary", primary: true, route: "/itineraries?create=true" }],
  },
];

const DesktopQuickNav = () => {
  const navigate = useNavigate();

  const items = [
    { icon: Compass, label: "Experiences", route: "/things-to-do", color: "text-experience-color", bg: "bg-experience-color/8 hover:bg-experience-color/15" },
    { icon: Map, label: "Itineraries", route: "/itineraries", color: "text-itinerary-color", bg: "bg-itinerary-color/8 hover:bg-itinerary-color/15" },
    { icon: MapPinned, label: "Create", route: "/itineraries?create=true", color: "text-social-color", bg: "bg-social-color/8 hover:bg-social-color/15" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-[0.97]",
              item.bg, item.color
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

// Smooth horizontal scroll row with scroll buttons
const DesktopScrollRow = ({ 
  title, 
  variant = "default",
  onViewAll,
  children 
}: { 
  title: string;
  variant?: "itinerary" | "experience" | "default";
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

  const viewAllColor = variant === "itinerary" ? "text-itinerary-color hover:text-itinerary-color/80" 
    : variant === "experience" ? "text-experience-color hover:text-experience-color/80" 
    : "text-muted-foreground hover:text-foreground";

  return (
    <div className="mb-10 group/row relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
        {onViewAll && (
          <button onClick={onViewAll} className={cn("text-sm font-semibold transition-colors", viewAllColor)}>
            Show all
          </button>
        )}
      </div>
      
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="inline-flex gap-4" style={{ minWidth: '100%' }}>
            {children}
          </div>
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Subtle fade edges */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none bg-gradient-to-r from-background/30 to-transparent z-[5]" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-3 pointer-events-none bg-gradient-to-l from-background/30 to-transparent z-[5]" />
        )}
      </div>
    </div>
  );
};

const SCROLL_STORAGE_KEY = "discover_scroll_position";

const synonyms: Record<string, string[]> = {
  Party: ["party","parties","nightlife","night life","club","clubs","clubbing","rave","raves","dj","djs","dance","dancing","turn up","night out","nights out","bar","bars","bar hopping","drinks","drinking","afterparty","after party","go out","going out","lounge","lounges","rooftop","cocktail","cocktails","pub","pubs","disco","live music"],
  "Water Sports": ["water","waters","water sports","watersports","watersport","water sport","jet ski","jetski","jet skis","jetskis","kayak","kayaks","kayaking","surf","surfs","surfing","snorkel","snorkels","snorkeling","snorkelling","dive","dives","diving","scuba","boat","boats","boating","sail","sails","sailing","paddle","paddles","paddle board","paddleboard","paddleboarding","swimming","swim","swims","sea","ocean","marine","underwater","fishing","fish","wakeboard","wakeboarding","kite","kiteboarding","kitesurf","kitesurfing","canoe","canoeing","rafting","raft"],
  Beach: ["beach","beaches","beachy","sun","sunny","sunbathe","sunbathing","sand","sandy","sands","sea","seas","ocean","oceans","coast","coastal","coasts","shore","shores","shoreline","tropical","tropics","island","islands","lagoon","lagoons","bay","bays","cove","coves","seaside","waterfront","palm","palms","palm tree","paradise","relax","relaxing","relaxation","tan","tanning","hammock"],
  Food: ["food","foods","foodie","foodies","eat","eats","eating","dine","dines","dining","restaurant","restaurants","cuisine","cuisines","street food","streetfood","tasting","tastings","taste","dinner","dinners","lunch","lunches","brunch","brunches","breakfast","breakfasts","cook","cooks","cooking","chef","chefs","culinary","gastronomy","gourmet","local food","traditional food","dish","dishes","meal","meals","cafe","cafes","coffee","coffees","tea","teas","bakery","bakeries","pastry","pastries","market","markets","spice","spices","seafood","bbq","barbecue","grill","grilled"],
  Wildlife: ["wildlife","wild life","wild","safari","safaris","animal","animals","nature","natural","reserve","reserves","park","parks","national park","game","game drive","game drives","lion","lions","elephant","elephants","giraffe","giraffes","zebra","zebras","hippo","hippos","rhino","rhinos","leopard","leopards","cheetah","cheetahs","bird","birds","birding","birdwatching","bird watching","monkey","monkeys","gorilla","gorillas","chimp","chimps","chimpanzee","chimpanzees","migration","wildebeest","buffalo","buffalos","crocodile","crocodiles","flamingo","flamingos","sanctuary","conservancy","conservation","jungle","forest","rainforest"],
  Adventure: ["adventure","adventures","adventurous","hike","hikes","hiking","trek","treks","trekking","zipline","ziplines","ziplining","zip line","climb","climbs","climbing","mountain","mountains","mountaineering","explore","explores","exploring","exploration","explorer","extreme","thrill","thrills","thrilling","adrenaline","bungee","skydive","skydiving","paraglide","paragliding","abseil","abseiling","rappel","rappelling","rock climbing","caving","cave","caves","volcano","volcanoes","crater","craters","waterfall","waterfalls","canopy","outdoor","outdoors","off road","offroad","quad","quad bike","atv","4x4","jeep"],
  Culture: ["culture","cultures","cultural","museum","museums","art","arts","artistic","heritage","history","historic","historical","local","locals","traditional","tradition","traditions","temple","temples","church","churches","mosque","mosques","monument","monuments","architecture","architectural","ancient","ruins","ruin","craft","crafts","craftsmanship","artisan","artisans","handicraft","handicrafts","gallery","galleries","festival","festivals","ceremony","ceremonies","dance","dances","music","tribe","tribes","tribal","village","villages","community","communities","tour","tours","walking tour","guided"],
  Wellness: ["wellness","spa","spas","massage","massages","yoga","meditation","meditate","relax","relaxing","relaxation","retreat","retreats","health","healthy","healing","holistic","mindfulness","zen","detox","fitness","gym","workout","exercise"],
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
      return browseDataCities.find(c => c.name.toLowerCase() === cityParam.toLowerCase()) || null;
    }
    return null;
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const experiences = useProductListings();
  const { data: popularItinerariesForSearch = [] } = usePopularItineraries();
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { activeItinerary, experienceCount } = useItineraries();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const cityFilteredExperiences = useMemo(() => {
    if (!selectedCity) return experiences;
    return experiences.filter(e => e.location?.toLowerCase().includes(selectedCity.name.toLowerCase()));
  }, [experiences, selectedCity]);

  const adventureExps = useMemo(() => cityFilteredExperiences.filter(e => e.category === "Adventure").slice(0, 10), [cityFilteredExperiences]);
  const foodExps = useMemo(() => cityFilteredExperiences.filter(e => e.category === "Food").slice(0, 10), [cityFilteredExperiences]);
  const beachExps = useMemo(() => cityFilteredExperiences.filter(e => e.category === "Beach").slice(0, 10), [cityFilteredExperiences]);

  // Sync city from URL params
  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
      const found = browseDataCities.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
      if (found) setSelectedCity(found);
    } else {
      setSelectedCity(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition && scrollContainerRef.current) {
      const position = parseInt(savedPosition, 10);
      setTimeout(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = position;
      }, 0);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, scrollContainerRef.current.scrollTop.toString());
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < experiences.length) {
          setVisibleCount((prev) => Math.min(prev + 18, experiences.length));
        }
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, experiences.length]);

  // On mobile: "/" shows homepage, "/search" shows search overlay
  const isSearchRoute = window.location.pathname === '/search' || window.location.pathname === '/discover';
  
  // Reset search query when entering search route fresh
  useEffect(() => {
    if (isMobile && isSearchRoute) {
      setSearchQuery("");
    }
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
        description="Explore curated experiences, activities and things to do in Zanzibar, Kilimanjaro, Nairobi and across East Africa. Build and share itineraries with friends."
        canonicalPath="/"
        indexability="public_indexed"
        jsonLd={createWebsiteJsonLd()}
      />
      <MobileHomeView />
    </>
  );

  const handleCitySelect = (city: City | null) => { setSelectedCity(city); setSelectedCategory(null); };
  const handleCategorySelect = (categoryName: string | null) => { setSelectedCategory(categoryName); };
  const clearFilters = () => { setSelectedCity(null); setSelectedCategory(null); setSearchQuery(""); };

  const normalizeText = (text: string) => text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  const partialMatch = (text: string, term: string) => {
    const words = normalizeText(text).split(" ");
    return words.some((word) => word.startsWith(term) || term.startsWith(word));
  };

  const filterByQuery = (
    item: { title?: string; name?: string; description?: string; creator?: string; location?: string; category?: string; experiences?: any[]; tags?: string[]; },
    q: string,
  ) => {
    if (!q) return true;
    const normalizedQuery = normalizeText(q);
    const searchTerms = normalizedQuery.split(" ").filter((t) => t.length > 1);
    const matchedCategories = new Set<string>();
    for (const [cat, terms] of Object.entries(synonyms)) {
      const catMatched = searchTerms.some((term) =>
        terms.some((t) => {
          const normalizedTerm = normalizeText(t);
          return normalizedTerm.includes(term) || term.includes(normalizedTerm) || normalizedTerm.split(" ").some((w) => w.startsWith(term) || term.startsWith(w));
        }),
      );
      if (catMatched) matchedCategories.add(cat.toLowerCase());
    }
    if (matchedCategories.size > 0) {
      const categoryMatch = matchedCategories.has(normalizeText(item.category || "")) || item.experiences?.some((exp) => matchedCategories.has(normalizeText(exp.category || "")));
      const titleCategoryMatch = Array.from(matchedCategories).some((cat) => normalizeText(item.title || item.name || "").includes(cat));
      if (categoryMatch || titleCategoryMatch) return true;
    }
    const fieldsToSearch = [item.title || item.name || "", item.description || "", item.creator || "", item.location || "", item.category || "", ...(item.tags || [])].map((f) => normalizeText(f));
    const textMatch = searchTerms.every((term) => fieldsToSearch.some((field) => field.includes(term) || partialMatch(field, term)));
    if (!textMatch && item.experiences) {
      const expMatch = item.experiences.some((exp) => {
        const expFields = [exp.title, exp.location, exp.category, exp.creator].map((f) => normalizeText(f || ""));
        return searchTerms.some((term) => expFields.some((field) => field.includes(term) || partialMatch(field, term)));
      });
      if (expMatch) return true;
    }
    return textMatch;
  };

  const filteredExperiences = experiences.filter((experience) => {
    if (selectedCity) {
      const cityMatch = experience.location?.toLowerCase().includes(selectedCity.name.toLowerCase());
      if (!cityMatch) return false;
    }
    if (selectedCategory) {
      const catMatch = experience.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!catMatch) return false;
    }
    return filterByQuery(experience, searchQuery.trim().toLowerCase());
  });

  const filteredItineraries = popularItinerariesForSearch.filter((itinerary) => {
    if (selectedCity) {
      const cityName = selectedCity.name.toLowerCase();
      const nameMatch = itinerary.name.toLowerCase().includes(cityName);
      const expMatch = itinerary.experiences?.some((exp: any) => exp.location?.toLowerCase().includes(cityName));
      if (!nameMatch && !expMatch) return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (itinerary.name.toLowerCase().includes(q)) return true;
    return filterByQuery(itinerary, q);
  });

  if (loading) {
    return (
      <MainLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCity={selectedCity} onCitySelect={handleCitySelect} onMobileSearchClick={() => setMobileSearchOpen(true)}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-sm">Loading experiences...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCity={selectedCity} onCitySelect={handleCitySelect} onMobileSearchClick={() => setMobileSearchOpen(true)}>
      <MobileSearchOverlay isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearch={(q) => setSearchQuery(q)} />

      <FixedSearchHeader
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        selectedCity={selectedCity} onCitySelect={handleCitySelect}
        selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect}
        onMobileSearchClick={() => setMobileSearchOpen(true)} isMobile={isMobile}
      />

      {/* Content - generous padding for breathing room */}
      <div className="px-4 md:px-8 lg:px-10 py-6">
        {!searchQuery && (
          <DesktopQuickNav />
        )}

        {!selectedCity && !searchQuery && (
          <>
            {filteredItineraries.length > 0 && (
              <DesktopScrollRow title="Attractions you can't miss" variant="itinerary" onViewAll={() => navigate("/itineraries")}>
                {filteredItineraries.slice(0, 6).map((it) => (
                  <div key={it.id} className="flex-shrink-0 w-[280px] lg:w-[300px] xl:w-[320px]">
                    <PublicItineraryCard itinerary={it} />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {cityFilteredExperiences.length > 0 && (
              <DesktopScrollRow title={selectedCity ? `${selectedCity.name} — Available next weekend` : "Available next weekend"} variant="experience" onViewAll={() => navigate("/things-to-do")}>
                {cityFilteredExperiences.slice(0, 8).map((exp) => (
                  <div key={exp.id} className="flex-shrink-0 w-[240px] lg:w-[260px] xl:w-[280px]">
                    <ExperienceCard {...exp} compact />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {filteredItineraries.length > 3 && (
              <DesktopScrollRow title="Curated by locals" variant="itinerary" onViewAll={() => navigate("/itineraries")}>
                {filteredItineraries.slice(3, 9).map((it) => (
                  <div key={it.id} className="flex-shrink-0 w-[280px] lg:w-[300px] xl:w-[320px]">
                    <PublicItineraryCard itinerary={it} />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {adventureExps.length > 0 && (
              <DesktopScrollRow title="Adventure awaits" variant="experience" onViewAll={() => navigate("/things-to-do")}>
                {adventureExps.map((exp) => (
                  <div key={exp.id} className="flex-shrink-0 w-[240px] lg:w-[260px] xl:w-[280px]">
                    <ExperienceCard {...exp} compact />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {filteredItineraries.length > 1 && (
              <DesktopScrollRow title="Weekend getaways" variant="itinerary" onViewAll={() => navigate("/itineraries")}>
                {filteredItineraries.slice(1, 7).map((it) => (
                  <div key={it.id} className="flex-shrink-0 w-[280px] lg:w-[300px] xl:w-[320px]">
                    <PublicItineraryCard itinerary={it} />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {foodExps.length > 0 && (
              <DesktopScrollRow title="Taste the local flavors" variant="experience" onViewAll={() => navigate("/things-to-do")}>
                {foodExps.map((exp) => (
                  <div key={exp.id} className="flex-shrink-0 w-[240px] lg:w-[260px] xl:w-[280px]">
                    <ExperienceCard {...exp} compact />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {filteredItineraries.length > 2 && (
              <DesktopScrollRow title="Popular this week" variant="itinerary" onViewAll={() => navigate("/itineraries")}>
                {filteredItineraries.slice(2, 8).map((it) => (
                  <div key={it.id} className="flex-shrink-0 w-[280px] lg:w-[300px] xl:w-[320px]">
                    <PublicItineraryCard itinerary={it} />
                  </div>
                ))}
              </DesktopScrollRow>
            )}

            {beachExps.length > 0 && (
              <DesktopScrollRow title="Beach vibes" variant="experience" onViewAll={() => navigate("/things-to-do")}>
                {beachExps.map((exp) => (
                  <div key={exp.id} className="flex-shrink-0 w-[240px] lg:w-[260px] xl:w-[280px]">
                    <ExperienceCard {...exp} compact />
                  </div>
                ))}
              </DesktopScrollRow>
            )}
          </>
        )}




        {/* Filtered results */}
        {(selectedCategory || searchQuery) && (
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-4">
              {selectedCategory
                ? `${selectedCategory} in ${selectedCity?.name || "All Locations"}`
                : selectedCity
                  ? `${selectedCity.name} Experiences`
                  : "Search Results"}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
              {filteredExperiences.map((experience) => (
                <ExperienceCard key={experience.id} {...experience} compact />
              ))}
            </div>

            {filteredExperiences.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-base">
                  No experiences found. Try adjusting your filters or search query.
                </p>
                {(selectedCity || selectedCategory) && (
                  <Button variant="outline" className="mt-4 rounded-full" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SearchPage;
