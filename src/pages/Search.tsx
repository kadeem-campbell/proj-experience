import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { BrowseDropdown } from "@/components/BrowseDropdown";
import { LiveActivityBanner } from "@/components/LiveActivityBanner";
import { useItineraries } from "@/hooks/useItineraries";
import { publicItinerariesData, getPopularItineraries } from "@/data/itinerariesData";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { City, cities } from "@/data/browseData";

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
  const { activeItinerary, experienceCount } = useItineraries();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Synonym-based filtering
  const synonyms: Record<string, string[]> = {
    Party: ["party", "nightlife", "club", "clubbing", "rave", "dj", "dance", "turn up", "night out", "bar hopping", "drinks", "afterparty", "go out", "going out"],
    "Water Sports": ["water sports", "watersports", "jet ski", "jetski", "kayak", "kayaking", "surf", "surfing", "snorkel", "snorkeling", "dive", "diving", "boat", "sail", "paddle board", "paddleboard"],
    Beach: ["beach", "sun", "sand", "sea", "ocean", "coast", "shore", "tropical"],
    Food: ["food", "eat", "dine", "dining", "restaurant", "cuisine", "street food", "tasting", "dinner", "lunch", "brunch", "cook", "cooking"],
    Wildlife: ["wildlife", "safari", "animals", "nature", "reserve", "park"],
    Adventure: ["adventure", "hike", "hiking", "trek", "trekking", "zipline", "climb", "climbing", "mountain", "explore", "exploring"],
    Culture: ["culture", "museum", "art", "heritage", "history", "local", "traditional"],
  };

  const filteredExperiences = experiences.filter((experience) => {
    // City filter
    if (selectedCity) {
      const cityMatch = experience.location?.toLowerCase().includes(selectedCity.name.toLowerCase());
      if (!cityMatch) return false;
    }

    // Category filter (from browse)
    if (selectedCategory) {
      const catMatch = experience.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!catMatch) return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const textMatch =
      experience.title?.toLowerCase().includes(q) ||
      experience.description?.toLowerCase().includes(q) ||
      experience.creator?.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q);

    const hintedCategories = new Set<string>();
    Object.entries(synonyms).forEach(([cat, terms]) => {
      if (terms.some((t) => q.includes(t))) hintedCategories.add(cat.toLowerCase());
    });

    const synonymMatch =
      hintedCategories.size > 0
        ? hintedCategories.has((experience.category || "").toLowerCase())
        : false;

    return textMatch || synonymMatch;
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
        {/* Fixed Search Header - Spotify Style */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-2 md:py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-2xl">
            <div className="flex items-center flex-1 bg-muted rounded-full px-3 md:px-4 py-2">
              <Search className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground mr-2 md:mr-3 shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to explore?"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm md:text-base placeholder:text-muted-foreground"
              />
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <BrowseDropdown 
              onSelectCity={handleCitySelect}
              onClearFilters={clearFilters}
            />
          </form>

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
          {!selectedCity && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold">Top Itineraries</h2>
                <Link to="/itineraries?filter=popular">
                  <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
                    See All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {getPopularItineraries().slice(0, 3).map((itinerary) => (
                  <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                ))}
              </div>
            </div>
          )}

          {/* All Experiences Section with Infinite Scroll */}
          {!selectedCity && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold">All Experiences</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {experiences.slice(0, visibleCount).map((experience) => (
                  <ExperienceCard key={experience.id} {...experience} compact />
                ))}
              </div>
              {/* Infinite scroll trigger */}
              {visibleCount < experiences.length && (
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
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  <h2 className="text-base md:text-xl font-semibold">{selectedCity.name} Popular Experiences</h2>
                </div>
              </div>
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
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
