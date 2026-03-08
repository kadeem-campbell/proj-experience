import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { FixedSearchHeader } from "@/components/FixedSearchHeader";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { MobileHomeView } from "@/components/MobileHomeView";
import { useItineraries } from "@/hooks/useItineraries";
import { getPopularItineraries, publicItinerariesData } from "@/data/itinerariesData";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { City } from "@/data/browseData";
import { useIsMobile } from "@/hooks/use-mobile";
import { allExperiences } from "@/hooks/useExperiencesData";

const SCROLL_STORAGE_KEY = "discover_scroll_position";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const experiences = allExperiences;
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { activeItinerary, experienceCount } = useItineraries();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition && scrollContainerRef.current) {
      const position = parseInt(savedPosition, 10);
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = position;
        }
      }, 0);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, scrollContainerRef.current.scrollTop.toString());
    }
  }, []);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < experiences.length) {
          setVisibleCount((prev) => Math.min(prev + 18, experiences.length));
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, experiences.length]);

  // On mobile, render the new Airbnb-style home view
  if (isMobile) {
    return <MobileHomeView />;
  }

  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
  };

  const clearFilters = () => {
    setSelectedCity(null);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  // Comprehensive synonym-based filtering for tags
  const synonyms: Record<string, string[]> = {
    Party: [
      "party",
      "parties",
      "nightlife",
      "night life",
      "club",
      "clubs",
      "clubbing",
      "rave",
      "raves",
      "dj",
      "djs",
      "dance",
      "dancing",
      "turn up",
      "night out",
      "nights out",
      "bar",
      "bars",
      "bar hopping",
      "drinks",
      "drinking",
      "afterparty",
      "after party",
      "go out",
      "going out",
      "lounge",
      "lounges",
      "rooftop",
      "cocktail",
      "cocktails",
      "pub",
      "pubs",
      "disco",
      "live music",
    ],
    "Water Sports": [
      "water",
      "waters",
      "water sports",
      "watersports",
      "watersport",
      "water sport",
      "jet ski",
      "jetski",
      "jet skis",
      "jetskis",
      "kayak",
      "kayaks",
      "kayaking",
      "surf",
      "surfs",
      "surfing",
      "snorkel",
      "snorkels",
      "snorkeling",
      "snorkelling",
      "dive",
      "dives",
      "diving",
      "scuba",
      "boat",
      "boats",
      "boating",
      "sail",
      "sails",
      "sailing",
      "paddle",
      "paddles",
      "paddle board",
      "paddleboard",
      "paddleboarding",
      "swimming",
      "swim",
      "swims",
      "sea",
      "ocean",
      "marine",
      "underwater",
      "fishing",
      "fish",
      "wakeboard",
      "wakeboarding",
      "kite",
      "kiteboarding",
      "kitesurf",
      "kitesurfing",
      "canoe",
      "canoeing",
      "rafting",
      "raft",
    ],
    Beach: [
      "beach",
      "beaches",
      "beachy",
      "sun",
      "sunny",
      "sunbathe",
      "sunbathing",
      "sand",
      "sandy",
      "sands",
      "sea",
      "seas",
      "ocean",
      "oceans",
      "coast",
      "coastal",
      "coasts",
      "shore",
      "shores",
      "shoreline",
      "tropical",
      "tropics",
      "island",
      "islands",
      "lagoon",
      "lagoons",
      "bay",
      "bays",
      "cove",
      "coves",
      "seaside",
      "waterfront",
      "palm",
      "palms",
      "palm tree",
      "paradise",
      "relax",
      "relaxing",
      "relaxation",
      "tan",
      "tanning",
      "hammock",
    ],
    Food: [
      "food",
      "foods",
      "foodie",
      "foodies",
      "eat",
      "eats",
      "eating",
      "dine",
      "dines",
      "dining",
      "restaurant",
      "restaurants",
      "cuisine",
      "cuisines",
      "street food",
      "streetfood",
      "tasting",
      "tastings",
      "taste",
      "dinner",
      "dinners",
      "lunch",
      "lunches",
      "brunch",
      "brunches",
      "breakfast",
      "breakfasts",
      "cook",
      "cooks",
      "cooking",
      "chef",
      "chefs",
      "culinary",
      "gastronomy",
      "gourmet",
      "local food",
      "traditional food",
      "dish",
      "dishes",
      "meal",
      "meals",
      "cafe",
      "cafes",
      "coffee",
      "coffees",
      "tea",
      "teas",
      "bakery",
      "bakeries",
      "pastry",
      "pastries",
      "market",
      "markets",
      "spice",
      "spices",
      "seafood",
      "bbq",
      "barbecue",
      "grill",
      "grilled",
    ],
    Wildlife: [
      "wildlife",
      "wild life",
      "wild",
      "safari",
      "safaris",
      "animal",
      "animals",
      "nature",
      "natural",
      "reserve",
      "reserves",
      "park",
      "parks",
      "national park",
      "game",
      "game drive",
      "game drives",
      "lion",
      "lions",
      "elephant",
      "elephants",
      "giraffe",
      "giraffes",
      "zebra",
      "zebras",
      "hippo",
      "hippos",
      "rhino",
      "rhinos",
      "leopard",
      "leopards",
      "cheetah",
      "cheetahs",
      "bird",
      "birds",
      "birding",
      "birdwatching",
      "bird watching",
      "monkey",
      "monkeys",
      "gorilla",
      "gorillas",
      "chimp",
      "chimps",
      "chimpanzee",
      "chimpanzees",
      "migration",
      "wildebeest",
      "buffalo",
      "buffalos",
      "crocodile",
      "crocodiles",
      "flamingo",
      "flamingos",
      "sanctuary",
      "conservancy",
      "conservation",
      "jungle",
      "forest",
      "rainforest",
    ],
    Adventure: [
      "adventure",
      "adventures",
      "adventurous",
      "hike",
      "hikes",
      "hiking",
      "trek",
      "treks",
      "trekking",
      "zipline",
      "ziplines",
      "ziplining",
      "zip line",
      "climb",
      "climbs",
      "climbing",
      "mountain",
      "mountains",
      "mountaineering",
      "explore",
      "explores",
      "exploring",
      "exploration",
      "explorer",
      "extreme",
      "thrill",
      "thrills",
      "thrilling",
      "adrenaline",
      "bungee",
      "skydive",
      "skydiving",
      "paraglide",
      "paragliding",
      "abseil",
      "abseiling",
      "rappel",
      "rappelling",
      "rock climbing",
      "caving",
      "cave",
      "caves",
      "volcano",
      "volcanoes",
      "crater",
      "craters",
      "waterfall",
      "waterfalls",
      "canopy",
      "outdoor",
      "outdoors",
      "off road",
      "offroad",
      "quad",
      "quad bike",
      "atv",
      "4x4",
      "jeep",
    ],
    Culture: [
      "culture",
      "cultures",
      "cultural",
      "museum",
      "museums",
      "art",
      "arts",
      "artistic",
      "heritage",
      "history",
      "historic",
      "historical",
      "local",
      "locals",
      "traditional",
      "tradition",
      "traditions",
      "temple",
      "temples",
      "church",
      "churches",
      "mosque",
      "mosques",
      "monument",
      "monuments",
      "architecture",
      "architectural",
      "ancient",
      "ruins",
      "ruin",
      "craft",
      "crafts",
      "craftsmanship",
      "artisan",
      "artisans",
      "handicraft",
      "handicrafts",
      "gallery",
      "galleries",
      "festival",
      "festivals",
      "ceremony",
      "ceremonies",
      "dance",
      "dances",
      "music",
      "tribe",
      "tribes",
      "tribal",
      "village",
      "villages",
      "community",
      "communities",
      "tour",
      "tours",
      "walking tour",
      "guided",
    ],
    Wellness: [
      "wellness",
      "spa",
      "spas",
      "massage",
      "massages",
      "yoga",
      "meditation",
      "meditate",
      "relax",
      "relaxing",
      "relaxation",
      "retreat",
      "retreats",
      "health",
      "healthy",
      "healing",
      "holistic",
      "mindfulness",
      "zen",
      "detox",
      "fitness",
      "gym",
      "workout",
      "exercise",
    ],
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  };

  const partialMatch = (text: string, term: string) => {
    const words = normalizeText(text).split(" ");
    return words.some((word) => word.startsWith(term) || term.startsWith(word));
  };

  const filterByQuery = (
    item: {
      title?: string;
      name?: string;
      description?: string;
      creator?: string;
      location?: string;
      category?: string;
      experiences?: any[];
      tags?: string[];
    },
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
          return (
            normalizedTerm.includes(term) ||
            term.includes(normalizedTerm) ||
            normalizedTerm.split(" ").some((w) => w.startsWith(term) || term.startsWith(w))
          );
        }),
      );
      if (catMatched) matchedCategories.add(cat.toLowerCase());
    }

    if (matchedCategories.size > 0) {
      const categoryMatch =
        matchedCategories.has(normalizeText(item.category || "")) ||
        item.experiences?.some((exp) => matchedCategories.has(normalizeText(exp.category || "")));
      const titleCategoryMatch = Array.from(matchedCategories).some((cat) =>
        normalizeText(item.title || item.name || "").includes(cat),
      );
      if (categoryMatch || titleCategoryMatch) return true;
    }

    const fieldsToSearch = [
      item.title || item.name || "",
      item.description || "",
      item.creator || "",
      item.location || "",
      item.category || "",
      ...(item.tags || []),
    ].map((f) => normalizeText(f));

    const textMatch = searchTerms.every((term) =>
      fieldsToSearch.some((field) => field.includes(term) || partialMatch(field, term)),
    );

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

    const q = searchQuery.trim().toLowerCase();
    return filterByQuery(experience, q);
  });

  const filteredItineraries = getPopularItineraries().filter((itinerary) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (itinerary.name.toLowerCase().includes(q)) return true;
    return filterByQuery(itinerary, q);
  });

  if (loading) {
    return (
      <MainLayout
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        onMobileSearchClick={() => setMobileSearchOpen(true)}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading experiences...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCity={selectedCity}
      onCitySelect={handleCitySelect}
      onMobileSearchClick={() => setMobileSearchOpen(true)}
    >
      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => setSearchQuery(q)}
      />

      {/* TikTok-style hide-on-scroll header */}
      <FixedSearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onMobileSearchClick={() => setMobileSearchOpen(true)}
        isMobile={isMobile}
      />

      {/* Content */}
      <div className="p-3 md:p-6">
        {/* Welcome Intro - visible for first-time visitors */}
        {!selectedCity && !searchQuery && (
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Discover Experiences</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Curated activities and itineraries from local creators. Save your favorites and plan your perfect trip.
            </p>
          </div>
        )}

        {/* Top Itineraries Section */}
        {!selectedCity && filteredItineraries.length > 0 && (
          <div className="mb-6 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">Itineraries</h2>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-sm md:text-base font-medium px-4 py-2 h-auto"
                onClick={() => navigate("/itineraries")}
              >
                View all →
              </Button>
            </div>
            {/* Itinerary grid: 2 on mobile, 3 on desktop for larger cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {filteredItineraries.slice(0, 3).map((itinerary) => (
                <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </div>
          </div>
        )}

        {/* All Experiences Section - TikTok-style 6-column grid on desktop */}
        {!selectedCity && filteredExperiences.length > 0 && (
          <div className="mb-6 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">All Experiences</h2>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-sm md:text-base font-medium px-4 py-2 h-auto"
                onClick={() => navigate("/experiences")}
              >
                View all →
              </Button>
            </div>
            {/* Grid: max 4 columns on desktop for consistent card sizing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filteredExperiences.slice(0, visibleCount).map((experience) => (
                <ExperienceCard key={experience.id} {...experience} compact />
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {visibleCount < filteredExperiences.length && (
              <div ref={loadMoreRef} className="flex justify-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )}

        {/* City-specific Popular Experiences - When city is selected */}
        {selectedCity && !selectedCategory && (
          <div className="mb-6 md:mb-10">
            <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">{selectedCity.name} Popular Experiences</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {publicItinerariesData
                .filter(
                  (it) =>
                    it.name.toLowerCase().includes(selectedCity.name.toLowerCase()) ||
                    it.experiences.some((exp) => exp.location?.toLowerCase().includes(selectedCity.name.toLowerCase())),
                )
                .map((itinerary) => (
                  <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                ))}
            </div>
          </div>
        )}

        {/* Filtered Experiences Section - Only show when city/category is selected */}
        {(selectedCity || selectedCategory || searchQuery) && (
          <div>
            <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">
              {selectedCategory
                ? `${selectedCategory} in ${selectedCity?.name || "All Locations"}`
                : selectedCity
                  ? `${selectedCity.name} Experiences`
                  : "Search Results"}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filteredExperiences.map((experience) => (
                <ExperienceCard key={experience.id} {...experience} compact />
              ))}
            </div>

            {/* Empty State */}
            {filteredExperiences.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <p className="text-muted-foreground text-sm md:text-lg">
                  No experiences found. Try adjusting your filters or search query.
                </p>
                {(selectedCity || selectedCategory) && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
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
