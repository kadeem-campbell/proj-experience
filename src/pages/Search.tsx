import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { BrowseDropdown } from "@/components/BrowseDropdown";
import { LiveActivityBanner } from "@/components/LiveActivityBanner";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { useItineraries } from "@/hooks/useItineraries";
import { publicItinerariesData, getPopularItineraries } from "@/data/itinerariesData";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { City, cities } from "@/data/browseData";
import { useIsMobile } from "@/hooks/use-mobile";

// Import experience images
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

const mockExperiences = [
  {
    id: "1",
    title: "Jet Ski Adventure",
    creator: "JohnDoe",
    views: "5000",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar Es Salaam",
    price: "$49"
  },
  {
    id: "2", 
    title: "Beach Party Extravaganza",
    creator: "BeachVibes",
    views: "12.5K",
    videoThumbnail: partyImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Party",
    location: "Zanzibar",
    price: "$35"
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    views: "8.2K", 
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Serengeti",
    price: "$120"
  },
  {
    id: "4",
    title: "Local Food Tasting Tour",
    creator: "FoodieGuide",
    views: "6.7K",
    videoThumbnail: foodImage,
    category: "Food",
    location: "Stone Town",
    price: "$25"
  },
  {
    id: "5",
    title: "Tropical Beach Paradise",
    creator: "BeachLover",
    views: "15.3K",
    videoThumbnail: beachImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Beach", 
    location: "Kendwa",
    price: "$40"
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    views: "4.1K",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Mount Kilimanjaro",
    price: "$200"
  }
];

// Combine mock experiences with all experiences from public itineraries
const getAllExperiences = () => {
  const itineraryExperiences = publicItinerariesData.flatMap(itinerary => 
    itinerary.experiences.map(exp => ({
      id: exp.id,
      title: exp.title,
      creator: exp.creator,
      views: "0",
      videoThumbnail: exp.videoThumbnail,
      videoUrl: "",
      category: exp.category,
      location: exp.location,
      price: exp.price,
    }))
  );
  
  // Combine and deduplicate by id
  const allExperiences = [...mockExperiences, ...itineraryExperiences];
  const uniqueExperiences = allExperiences.filter((exp, index, self) => 
    index === self.findIndex(e => e.id === exp.id)
  );
  
  return uniqueExperiences;
};

const SCROLL_STORAGE_KEY = 'discover_scroll_position';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<any[]>(getAllExperiences());
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { activeItinerary, experienceCount } = useItineraries();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition && scrollContainerRef.current) {
      const position = parseInt(savedPosition, 10);
      // Use setTimeout to ensure DOM is ready
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
          setVisibleCount(prev => Math.min(prev + 12, experiences.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, experiences.length]);
  const navigate = useNavigate();

  const getDefaultImage = (category: string) => {
    const imageMap: { [key: string]: string } = {
      'Water Sports': jetskiImage,
      'Party': partyImage,
      'Wildlife': wildlifeImage,
      'Food': foodImage,
      'Beach': beachImage,
      'Adventure': adventureImage,
      'Food & Dining': foodImage,
      'Nightlife': partyImage
    };
    return imageMap[category] || jetskiImage;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is live, this is just for form submission
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const clearFilters = () => {
    setSelectedCity(null);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  // Comprehensive synonym-based filtering for tags
  const synonyms: Record<string, string[]> = {
    Party: ["party", "parties", "nightlife", "night life", "club", "clubs", "clubbing", "rave", "raves", "dj", "djs", "dance", "dancing", "turn up", "night out", "nights out", "bar", "bars", "bar hopping", "drinks", "drinking", "afterparty", "after party", "go out", "going out", "lounge", "lounges", "rooftop", "cocktail", "cocktails", "pub", "pubs", "disco", "live music"],
    "Water Sports": ["water", "waters", "water sports", "watersports", "watersport", "water sport", "jet ski", "jetski", "jet skis", "jetskis", "kayak", "kayaks", "kayaking", "surf", "surfs", "surfing", "snorkel", "snorkels", "snorkeling", "snorkelling", "dive", "dives", "diving", "scuba", "boat", "boats", "boating", "sail", "sails", "sailing", "paddle", "paddles", "paddle board", "paddleboard", "paddleboarding", "swimming", "swim", "swims", "sea", "ocean", "marine", "underwater", "fishing", "fish", "wakeboard", "wakeboarding", "kite", "kiteboarding", "kitesurf", "kitesurfing", "canoe", "canoeing", "rafting", "raft"],
    Beach: ["beach", "beaches", "beachy", "sun", "sunny", "sunbathe", "sunbathing", "sand", "sandy", "sands", "sea", "seas", "ocean", "oceans", "coast", "coastal", "coasts", "shore", "shores", "shoreline", "tropical", "tropics", "island", "islands", "lagoon", "lagoons", "bay", "bays", "cove", "coves", "seaside", "waterfront", "palm", "palms", "palm tree", "paradise", "relax", "relaxing", "relaxation", "tan", "tanning", "hammock"],
    Food: ["food", "foods", "foodie", "foodies", "eat", "eats", "eating", "dine", "dines", "dining", "restaurant", "restaurants", "cuisine", "cuisines", "street food", "streetfood", "tasting", "tastings", "taste", "dinner", "dinners", "lunch", "lunches", "brunch", "brunches", "breakfast", "breakfasts", "cook", "cooks", "cooking", "chef", "chefs", "culinary", "gastronomy", "gourmet", "local food", "traditional food", "dish", "dishes", "meal", "meals", "cafe", "cafes", "coffee", "coffees", "tea", "teas", "bakery", "bakeries", "pastry", "pastries", "market", "markets", "spice", "spices", "seafood", "bbq", "barbecue", "grill", "grilled"],
    Wildlife: ["wildlife", "wild life", "wild", "safari", "safaris", "animal", "animals", "nature", "natural", "reserve", "reserves", "park", "parks", "national park", "game", "game drive", "game drives", "lion", "lions", "elephant", "elephants", "giraffe", "giraffes", "zebra", "zebras", "hippo", "hippos", "rhino", "rhinos", "leopard", "leopards", "cheetah", "cheetahs", "bird", "birds", "birding", "birdwatching", "bird watching", "monkey", "monkeys", "gorilla", "gorillas", "chimp", "chimps", "chimpanzee", "chimpanzees", "migration", "wildebeest", "buffalo", "buffalos", "crocodile", "crocodiles", "flamingo", "flamingos", "sanctuary", "conservancy", "conservation", "jungle", "forest", "rainforest"],
    Adventure: ["adventure", "adventures", "adventurous", "hike", "hikes", "hiking", "trek", "treks", "trekking", "zipline", "ziplines", "ziplining", "zip line", "climb", "climbs", "climbing", "mountain", "mountains", "mountaineering", "explore", "explores", "exploring", "exploration", "explorer", "extreme", "thrill", "thrills", "thrilling", "adrenaline", "bungee", "skydive", "skydiving", "paraglide", "paragliding", "abseil", "abseiling", "rappel", "rappelling", "rock climbing", "caving", "cave", "caves", "volcano", "volcanoes", "crater", "craters", "waterfall", "waterfalls", "canopy", "outdoor", "outdoors", "off road", "offroad", "quad", "quad bike", "atv", "4x4", "jeep"],
    Culture: ["culture", "cultures", "cultural", "museum", "museums", "art", "arts", "artistic", "heritage", "history", "historic", "historical", "local", "locals", "traditional", "tradition", "traditions", "temple", "temples", "church", "churches", "mosque", "mosques", "monument", "monuments", "architecture", "architectural", "ancient", "ruins", "ruin", "craft", "crafts", "craftsmanship", "artisan", "artisans", "handicraft", "handicrafts", "gallery", "galleries", "festival", "festivals", "ceremony", "ceremonies", "dance", "dances", "music", "tribe", "tribes", "tribal", "village", "villages", "community", "communities", "tour", "tours", "walking tour", "guided"],
    Romantic: ["romantic", "romance", "couple", "couples", "honeymoon", "honeymoons", "anniversary", "love", "date", "dates", "dating", "sunset", "sunsets", "sunrise", "sunrises", "candlelit", "candle", "spa", "spas", "massage", "massages", "private", "intimate", "secluded", "getaway", "getaways", "retreat", "retreats", "escape", "escapes"],
    Family: ["family", "families", "kid", "kids", "child", "children", "family friendly", "family-friendly", "educational", "education", "learn", "learning", "playground", "playgrounds", "zoo", "zoos", "aquarium", "aquariums", "theme park", "amusement"],
    Wellness: ["wellness", "spa", "spas", "massage", "massages", "yoga", "meditation", "meditate", "relax", "relaxing", "relaxation", "retreat", "retreats", "health", "healthy", "healing", "holistic", "mindfulness", "zen", "detox", "fitness", "gym", "workout", "exercise"],
    Shopping: ["shopping", "shop", "shops", "store", "stores", "market", "markets", "mall", "malls", "boutique", "boutiques", "souvenir", "souvenirs", "craft", "crafts", "art", "antique", "antiques", "fashion", "clothes", "clothing", "jewelry", "jewellery"],
    Nightlife: ["nightlife", "night life", "club", "clubs", "clubbing", "bar", "bars", "pub", "pubs", "lounge", "lounges", "disco", "discos", "party", "parties", "dj", "djs", "live music", "dance", "dancing", "drinks", "cocktail", "cocktails", "rooftop"],
  };

  // City names and aliases for search matching
  const cityAliases: Record<string, string[]> = {
    "zanzibar": ["zanzibar", "stone town", "stonetown", "unguja", "pemba", "nungwi", "kendwa", "paje", "jambiani"],
    "dar es salaam": ["dar es salaam", "dar", "dsm", "dar-es-salaam", "daressalaam"],
    "nairobi": ["nairobi", "nai", "nairobi kenya", "kenya"],
    "addis ababa": ["addis ababa", "addis", "ethiopia", "ethiopian"],
    "kigali": ["kigali", "rwanda", "rwandan"],
    "kampala": ["kampala", "uganda", "ugandan"],
    "entebbe": ["entebbe", "lake victoria"],
  };

  // Normalize search text
  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // Check if any word starts with the search term (for partial matching)
  const partialMatch = (text: string, term: string) => {
    const words = normalizeText(text).split(' ');
    return words.some(word => word.startsWith(term) || term.startsWith(word));
  };

  const filterByQuery = (item: { title?: string; name?: string; description?: string; creator?: string; location?: string; category?: string; experiences?: any[]; tags?: string[] }, q: string) => {
    if (!q) return true;
    
    const normalizedQuery = normalizeText(q);
    const searchTerms = normalizedQuery.split(' ').filter(t => t.length > 1);
    
    // Check for city match in search
    for (const [cityKey, aliases] of Object.entries(cityAliases)) {
      if (aliases.some(alias => normalizedQuery.includes(alias) || searchTerms.some(term => alias.includes(term)))) {
        const locationMatch = item.location && aliases.some(alias => 
          normalizeText(item.location!).includes(alias) || partialMatch(item.location!, alias.split(' ')[0])
        );
        const expLocationMatch = item.experiences?.some(exp => 
          exp.location && aliases.some(alias => normalizeText(exp.location).includes(alias))
        );
        if (locationMatch || expLocationMatch) return true;
      }
    }

    // Check for tag/category synonym match - more flexible matching
    const matchedCategories = new Set<string>();
    for (const [cat, terms] of Object.entries(synonyms)) {
      const catMatched = searchTerms.some(term => 
        terms.some(t => {
          const normalizedTerm = normalizeText(t);
          return normalizedTerm.includes(term) || term.includes(normalizedTerm) || 
                 normalizedTerm.split(' ').some(w => w.startsWith(term) || term.startsWith(w));
        })
      );
      if (catMatched) matchedCategories.add(cat.toLowerCase());
    }

    if (matchedCategories.size > 0) {
      const categoryMatch = matchedCategories.has(normalizeText(item.category || "")) ||
        item.experiences?.some(exp => matchedCategories.has(normalizeText(exp.category || "")));
      // Also check if title contains category keywords
      const titleCategoryMatch = Array.from(matchedCategories).some(cat => 
        normalizeText(item.title || item.name || "").includes(cat)
      );
      if (categoryMatch || titleCategoryMatch) return true;
    }

    // Text match on all fields with partial matching
    const fieldsToSearch = [
      item.title || item.name || "",
      item.description || "",
      item.creator || "",
      item.location || "",
      item.category || "",
      ...(item.tags || [])
    ].map(f => normalizeText(f));

    const textMatch = searchTerms.every(term =>
      fieldsToSearch.some(field => field.includes(term) || partialMatch(field, term))
    );

    // Also check experience fields for itineraries
    if (!textMatch && item.experiences) {
      const expMatch = item.experiences.some(exp => {
        const expFields = [exp.title, exp.location, exp.category, exp.creator].map(f => normalizeText(f || ""));
        return searchTerms.some(term => expFields.some(field => field.includes(term) || partialMatch(field, term)));
      });
      if (expMatch) return true;
    }

    return textMatch;
  };

  const filteredExperiences = experiences.filter((experience) => {
    // City filter from dropdown
    if (selectedCity) {
      const cityMatch = experience.location?.toLowerCase().includes(selectedCity.name.toLowerCase());
      if (!cityMatch) return false;
    }

    // Category filter from browse
    if (selectedCategory) {
      const catMatch = experience.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!catMatch) return false;
    }

    const q = searchQuery.trim().toLowerCase();
    return filterByQuery(experience, q);
  });

  // Filter itineraries by search query
  const filteredItineraries = getPopularItineraries().filter((itinerary) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    
    // Check itinerary name
    if (itinerary.name.toLowerCase().includes(q)) return true;
    
    // Check if any experience matches
    return filterByQuery(itinerary, q);
  });

  if (loading) {
    return (
      <MainLayout>
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
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Mobile Search Overlay */}
        <MobileSearchOverlay
          isOpen={mobileSearchOpen}
          onClose={() => setMobileSearchOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={(q) => setSearchQuery(q)}
        />

        {/* Fixed Search Header - Spotify Style */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 max-w-2xl">
            {/* Mobile: Tappable search trigger */}
            {isMobile ? (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="flex items-center flex-1 min-w-0 bg-muted/60 border border-border/50 rounded-full px-4 py-3.5 text-left"
              >
                <Search className="w-5 h-5 text-foreground/70 mr-3 shrink-0" />
                <span className="text-foreground/50 text-base truncate">
                  {searchQuery || "What do you want to explore?"}
                </span>
              </button>
            ) : (
              /* Desktop: Inline search input */
              <form onSubmit={handleSearch} className="flex items-center flex-1 bg-muted/60 border border-border/50 rounded-full px-4 py-2">
                <Search className="w-5 h-5 text-foreground/70 mr-3 shrink-0" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to explore?"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base placeholder:text-foreground/50"
                  style={{ fontSize: '16px' }}
                />
              </form>
            )}
            <div className="h-6 w-px bg-border hidden sm:block" />
            <BrowseDropdown 
              onSelectCity={handleCitySelect}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Active filters */}
          {(selectedCity || selectedCategory) && (
            <div className="flex items-center gap-2 mt-3">
              {selectedCity && (
                <span 
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: selectedCity.color }}
                >
                  {selectedCity.name}
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                  {selectedCategory}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 md:p-6"
        >
          {/* Live Activity Banner - Polymarket style */}
          <LiveActivityBanner experienceCount={experienceCount} />

          {/* Top Itineraries Section */}
          {!selectedCity && filteredItineraries.length > 0 && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold">Top Itineraries</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground text-sm"
                  onClick={() => navigate('/itineraries')}
                >
                  View all
                </Button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredItineraries.slice(0, 4).map((itinerary) => (
                  <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                ))}
              </div>
            </div>
          )}

          {/* All Experiences Section with Infinite Scroll */}
          {!selectedCity && filteredExperiences.length > 0 && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold">All Experiences</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground text-sm"
                  onClick={() => navigate('/experiences')}
                >
                  View all
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                {filteredExperiences.slice(0, visibleCount).map((experience) => (
                  <ExperienceCard key={experience.id} {...experience} compact />
                ))}
              </div>
              {/* Infinite scroll trigger */}
              {visibleCount < filteredExperiences.length && (
                <div 
                  ref={loadMoreRef}
                  className="flex justify-center py-6 md:py-8"
                >
                  <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          )}

          {/* City-specific Popular Experiences - When city is selected */}
          {selectedCity && !selectedCategory && (
            <div className="mb-6 md:mb-10">
              <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">
                {selectedCity.name} Popular Experiences
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {publicItinerariesData
                  .filter(it => it.name.toLowerCase().includes(selectedCity.name.toLowerCase()) || 
                    it.experiences.some(exp => exp.location?.toLowerCase().includes(selectedCity.name.toLowerCase())))
                  .map((itinerary) => (
                    <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
              </div>
            </div>
          )}

          {/* City Category Rows - When a city is selected but no category */}
          {selectedCity && !selectedCategory && (
            <div className="mb-6 md:mb-10">
              <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">
                Explore {selectedCity.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {selectedCity.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)}
                    className="relative h-20 md:h-24 rounded-lg overflow-hidden group transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: cat.color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                    <span className="absolute top-2 left-2 md:top-3 md:left-3 font-bold text-white text-sm md:text-base">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Experiences Section - Only show when city/category is selected */}
          {(selectedCity || selectedCategory || searchQuery) && (
            <div>
              <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">
                {selectedCategory 
                  ? `${selectedCategory} in ${selectedCity?.name}`
                  : selectedCity 
                    ? `${selectedCity.name} Experiences`
                    : "Search Results"
                }
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
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
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
