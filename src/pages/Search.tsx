import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ExperienceCard } from "@/components/ExperienceCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { publicItinerariesData, useItineraries } from "@/hooks/useItineraries";
import { Users, ArrowRight, Plus, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

const Search = () => {
  const [selectedCity, setSelectedCity] = useState("Dar Es Salaam");
  const [selectedCategory, setSelectedCategory] = useState("All Experiences");
  const [searchQuery, setSearchQuery] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { activeItinerary, experienceCount } = useItineraries();

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('id,title,creator,category,location,price,video_thumbnail,created_at,status')
        .eq('status', 'active')
        .order('created_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const formattedExperiences = (data ?? []).map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        creator: exp.creator,
        views: "0",
        videoThumbnail: exp.video_thumbnail || getDefaultImage(exp.category),
        videoUrl: "",
        category: exp.category,
        location: exp.location,
        price: typeof exp.price === 'number' ? `$${exp.price}` : `$${Number(exp.price || 0)}`,
      }));

      if (!formattedExperiences.length) {
        setExperiences(mockExperiences);
      } else {
        setExperiences([...formattedExperiences, ...mockExperiences]);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load experiences. Showing sample data.',
        variant: 'destructive',
      });
      setExperiences(mockExperiences);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
    const matchesCategory =
      selectedCategory === "All Experiences" || experience.category === selectedCategory;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;

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

    const matchesSearch = textMatch || synonymMatch;

    return matchesCategory && matchesSearch;
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
      <div className="p-4 md:p-6">
        {/* Itinerary CTA Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-medium">Plan your perfect trip</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Build Your <span className="gradient-primary bg-clip-text text-transparent">Dream Itinerary</span>
              </h1>
              <p className="text-muted-foreground mt-1">Add experiences, share with friends, and plan together</p>
            </div>
            
            <div className="flex items-center gap-3">
              {experienceCount > 0 ? (
                <Link to="/itinerary">
                  <Button size="lg" className="gap-2">
                    View Itinerary ({experienceCount})
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Click + to add experiences</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar 
          onSearch={handleSearch}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        {/* Public Itineraries Section */}
        <div className="mt-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Public Itineraries</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              Curated trips from travelers
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {publicItinerariesData.map((itinerary, index) => (
              <div
                key={itinerary.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PublicItineraryCard itinerary={itinerary} />
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Experiences Section - Spotify Album Style Grid */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">All Experiences</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredExperiences.map((experience, index) => (
              <div
                key={experience.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <ExperienceCard {...experience} compact />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredExperiences.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No experiences found. Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Search;