import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Heart, Plus, Layers, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";

type TabType = "itineraries" | "experiences";

// Horizontal scroll row component
const HorizontalScrollRow = ({ 
  title, 
  onTitleClick,
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-8">
      {/* Title with arrow */}
      <button 
        onClick={onTitleClick}
        className="flex items-center gap-1 mb-4 px-4 group"
      >
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <ChevronRight className="w-5 h-5 text-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
      
      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Itinerary card for horizontal scroll - Airbnb style
const MobileItineraryCard = ({ itinerary }: { itinerary: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', {
        id: itinerary.id,
        name: itinerary.name,
        coverImage: itinerary.coverImage,
        creatorName: itinerary.creatorName,
        experiences: itinerary.experiences?.slice(0, 3)
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[45vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/public-itinerary/${itinerary.id}`)}
    >
      {/* Image - 4:5 aspect ratio like Airbnb */}
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={itinerary.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}

        {/* Heart button - top right like Airbnb */}
        <button
          onClick={handleLikeClick}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
            liked && "bg-destructive/20"
          )}
        >
          <Heart 
            className={cn(
              "w-4 h-4",
              liked ? "fill-destructive text-destructive" : "text-foreground"
            )} 
          />
        </button>

        {/* Experience count badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xl shadow-sm flex items-center gap-1">
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>

      {/* Text below */}
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {itinerary.experiences?.[0]?.location || "Curated collection"}
        </p>
      </div>
    </div>
  );
};

// Experience card for horizontal scroll - Airbnb style
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { addExperienceToItinerary, activeItinerary, isInItinerary, removeExperienceFromItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;
  const inItinerary = isInItinerary(experience.id);

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id,
        title: experience.title,
        videoThumbnail: experience.videoThumbnail,
        location: experience.location,
        category: experience.category
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  const handleAddClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (activeItinerary) {
      if (inItinerary) {
        removeExperienceFromItinerary(activeItinerary.id, experience.id);
      } else {
        addExperienceToItinerary(activeItinerary.id, experience);
      }
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[45vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/experience/${experience.id}`)}
    >
      {/* Image - 4:5 aspect ratio */}
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img 
            src={experience.videoThumbnail} 
            alt={experience.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}

        {/* Heart button - top right */}
        <button
          onClick={handleLikeClick}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
            liked && "bg-destructive/20"
          )}
        >
          <Heart 
            className={cn(
              "w-4 h-4",
              liked ? "fill-destructive text-destructive" : "text-foreground"
            )} 
          />
        </button>

        {/* Add/Remove button - bottom right */}
        <button
          onClick={handleAddClick}
          className={cn(
            "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
            inItinerary 
              ? "bg-primary text-primary-foreground" 
              : "bg-background/70 backdrop-blur-xl shadow-sm"
          )}
        >
          <Plus className={cn("w-4 h-4", inItinerary ? "rotate-45" : "text-foreground")} />
        </button>
      </div>

      {/* Text below */}
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
        {experience.price && (
          <p className="text-xs text-muted-foreground">
            From ${experience.price}
          </p>
        )}
      </div>
    </div>
  );
};

export const MobileHomeView = () => {
  const [activeTab, setActiveTab] = useState<TabType>("itineraries");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const itineraries = getPopularItineraries();
  const experiences = allExperiences;

  // Group experiences by categories for different rows
  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);
  const wildlifeExperiences = experiences.filter(e => e.category === "Wildlife").slice(0, 10);
  const partyExperiences = experiences.filter(e => e.category === "Party").slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setMobileSearchOpen(false);
        }}
      />

      {/* Fixed Header - Airbnb style */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 safe-area-inset-top">
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="w-full flex items-center gap-3 bg-muted rounded-full px-4 py-3 shadow-sm border border-border/30"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Where to next?</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-6">
          <button
            onClick={() => setActiveTab("itineraries")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === "itineraries" 
                ? "text-foreground" 
                : "text-muted-foreground"
            )}
          >
            Itineraries
            {activeTab === "itineraries" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("experiences")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === "experiences" 
                ? "text-foreground" 
                : "text-muted-foreground"
            )}
          >
            Experiences
            {activeTab === "experiences" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="pt-28">
        {activeTab === "itineraries" ? (
          <>
            {/* Itineraries Row 1 - Attractions you can't miss */}
            <HorizontalScrollRow 
              title="Attractions you can't miss"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(0, 6).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>

            {/* Experience Row 1 - Available in Dar Es Salaam */}
            <HorizontalScrollRow 
              title="Available in Dar Es Salaam next weekend"
              onTitleClick={() => navigate("/experiences?location=dar")}
            >
              {experiences.slice(0, 8).map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>

            {/* More Itineraries Row */}
            <HorizontalScrollRow 
              title="Curated by locals"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(3, 9).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>

            {/* Adventure Experiences */}
            {adventureExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Adventure awaits"
                onTitleClick={() => navigate("/experiences?category=adventure")}
              >
                {adventureExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Food Experiences */}
            {foodExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Taste the local flavors"
                onTitleClick={() => navigate("/experiences?category=food")}
              >
                {foodExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}
          </>
        ) : (
          <>
            {/* Experiences Tab - Show different experience rows */}
            <HorizontalScrollRow 
              title="Available in Dar Es Salaam next weekend"
              onTitleClick={() => navigate("/experiences?location=dar")}
            >
              {experiences.slice(0, 8).map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>

            {/* Adventure Experiences */}
            {adventureExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Adventure awaits"
                onTitleClick={() => navigate("/experiences?category=adventure")}
              >
                {adventureExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Beach Experiences */}
            {beachExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Beach vibes"
                onTitleClick={() => navigate("/experiences?category=beach")}
              >
                {beachExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Food Experiences */}
            {foodExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Taste the local flavors"
                onTitleClick={() => navigate("/experiences?category=food")}
              >
                {foodExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Wildlife Experiences */}
            {wildlifeExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Wildlife encounters"
                onTitleClick={() => navigate("/experiences?category=wildlife")}
              >
                {wildlifeExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Party Experiences */}
            {partyExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Nightlife & parties"
                onTitleClick={() => navigate("/experiences?category=party")}
              >
                {partyExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {/* Show some itinerary rows too */}
            <HorizontalScrollRow 
              title="Curated collections"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(0, 6).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>
          </>
        )}
      </div>

      {/* Add CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
