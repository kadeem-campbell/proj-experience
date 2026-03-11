import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { Heart, Plus, Layers, MapPin, Map, Share2, MapPinned, Sparkles, Search, Check, ChevronRight } from "lucide-react";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const mapCities = [
  { name: "Zanzibar", available: true },
  { name: "Dar es Salaam", available: true },
  { name: "Nairobi", available: false, launchDate: "April 2026" },
  { name: "Kigali", available: false, launchDate: "May 2026" },
  { name: "Kampala", available: false, launchDate: "May 2026" },
  { name: "Entebbe", available: false, launchDate: "June 2026" },
  { name: "Addis Ababa", available: false, launchDate: "June 2026" },
];

const cities = ["Zanzibar", "Dar es Salaam", "Nairobi", "Kigali", "Kampala"];

const filterCategories = [
  { label: "Beaches", category: "Beach", icon: catBeaches },
  { label: "Nightlife", category: "Nightlife", icon: catNightlife },
  { label: "Nature", category: "Wildlife", icon: catNature },
  { label: "Adventure", category: "Adventure", icon: catAdventure },
  { label: "Food", category: "Food", icon: catFood },
];

const rotatingPlaceholders = [
  "Search the best beaches",
  "Search cultural experiences",
  "Search food tours",
  "Search hidden gems",
  "Search sunset spots",
];

const CategoryFilterPills = ({ 
  activeCategory, 
  onCategoryChange 
}: { 
  activeCategory: string; 
  onCategoryChange: (cat: string) => void;
}) => {
  return (
    <div className="px-4 pb-3">
      <div className="flex justify-between">
        {filterCategories.map((cat) => {
          const isActive = activeCategory === cat.category;
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryChange(isActive ? "" : cat.category)}
              className="flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <div className={cn(
                "w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all overflow-hidden",
                isActive 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "bg-muted"
              )}>
                <img src={cat.icon} alt={cat.label} className="w-11 h-11 object-contain" />
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Horizontal scroll row component
const HorizontalScrollRow = ({ 
  title, 
  onTitleClick,
  variant = "default",
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
  variant?: "itinerary" | "experience" | "default";
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  

  return (
    <div className="py-5 mb-2">
      <button 
        onClick={onTitleClick}
        className="mb-3 flex items-center gap-1.5 w-full text-left px-4 group"
      >
        <h2 className="text-[17px] font-bold text-foreground">{title}</h2>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-active:text-foreground transition-colors" />
      </button>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card
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
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', {
        id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage,
        creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3)
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer"
      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
    >
      <div className="relative aspect-[3/2.5] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-itinerary-color/20 to-itinerary-color/5 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-itinerary-color/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-2xl shadow-lg transition-colors",
          liked ? "bg-black/40 border border-white/10" : "bg-white/10 border border-white/15 hover:bg-white/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-white/90")} />
        </button>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground">{experienceCount} experiences</p>
        <p className="text-xs text-muted-foreground truncate">
          {itinerary.creatorName || 'Local Creator'}
        </p>
      </div>
    </div>
  );
};

// Experience card with + button
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id, title: experience.title,
        videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  const handleAdded = () => {
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1500);
  };

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer"
      onClick={() => navigate(`/experiences/${slugify(experience.title)}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-experience-color/20 to-experience-color/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-2xl shadow-lg transition-colors",
          liked ? "bg-black/40 border border-white/10" : "bg-white/10 border border-white/15 hover:bg-white/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-white/90")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ItinerarySelector
            experienceId={experience.id}
            experienceData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
            onAdd={handleAdded}
          >
            <button className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm transition-all active:scale-90",
              showTick ? "bg-primary/90" : "bg-white/80 hover:bg-experience-color/10"
            )}>
              {showTick ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Plus className="w-4 h-4 text-foreground" />
              )}
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{experience.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{experience.location}</p>
        {experience.price && (
          <p className="text-xs text-muted-foreground truncate">{experience.price} typical</p>
        )}
      </div>
    </div>
  );
};


// Static alias map - defined once outside component
const cityAliases: Record<string, string[]> = {
  "Zanzibar": ["Zanzibar", "Stone Town", "Kendwa", "Nungwi", "Paje", "Jambiani"],
  "Dar es Salaam": ["Dar es Salaam", "Dar Es Salaam", "Dar"],
  "Nairobi": ["Nairobi"],
};

const matchesCity = (location: string, city: string): boolean => {
  if (!city) return true;
  const aliases = cityAliases[city] || [city];
  return aliases.some(a => location.toLowerCase().includes(a.toLowerCase()));
};

const itineraryMatchesCity = (itinerary: any, city: string): boolean => {
  if (!city) return true;
  if (itinerary.name?.toLowerCase().includes(city.toLowerCase())) return true;
  return itinerary.experiences?.some((e: any) => matchesCity(e.location || "", city)) || false;
};

// Pre-compute all data once at module level
const allItinerariesData = getPopularItineraries();
const allExpsData = allExperiences;

// Category label map for row titles
const categoryLabelMap: Record<string, string> = {
  "Beach": "Beaches",
  "Nightlife": "Nightlife",
  "Wildlife": "Wildlife",
  "Adventure": "Adventures",
  "Food": "Food spots",
  "Culture": "Cultural experiences",
  "Water Sports": "Water sports",
};

export const MobileHomeView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [cityDrawerOpen, setCityDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % rotatingPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q || "");
    const city = searchParams.get("city");
    if (city !== null) setSelectedCity(city);
  }, [searchParams]);

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    setCityDrawerOpen(false);
  }, []);

  const itineraries = useMemo(() => {
    if (!selectedCity) return allItinerariesData;
    return allItinerariesData.filter(it => itineraryMatchesCity(it, selectedCity));
  }, [selectedCity]);

  const experiences = useMemo(() => {
    let filtered = allExpsData;
    if (selectedCity) {
      filtered = filtered.filter(e => matchesCity(e.location || "", selectedCity));
    }
    return filtered;
  }, [selectedCity]);

  // Category-filtered experiences
  const categoryExperiences = useMemo(() => {
    if (!activeCategory) return experiences;
    return experiences.filter(e => e.category === activeCategory);
  }, [experiences, activeCategory]);

  // Category-filtered itineraries (filter by whether they contain experiences of that category)
  const categoryItineraries = useMemo(() => {
    if (!activeCategory) return itineraries;
    return itineraries.filter(it => 
      it.experiences?.some((e: any) => e.category === activeCategory)
    );
  }, [itineraries, activeCategory]);

  // Search filtering - flexible matching
  const normalizeText = (text: string) => text.toLowerCase().replace(/[-_&]/g, " ").replace(/\s+/g, " ").trim();
  const stem = (word: string) => word.replace(/(es|s|ing|ed)$/i, "");
  
  const termMatches = (term: string, field: string) => {
    if (field.includes(term)) return true;
    const stemmed = stem(term);
    if (stemmed.length > 2 && field.includes(stemmed)) return true;
    return field.split(" ").some(w => w.startsWith(term) || w.startsWith(stemmed));
  };

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return categoryExperiences.filter(e => {
      const fields = [e.title, e.location, e.category, e.creator].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => termMatches(term, fields));
    });
  }, [searchQuery, categoryExperiences]);

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return categoryItineraries.filter(it => {
      const fields = [it.name, it.creatorName].map(f => normalizeText(f || "")).join(" ");
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = [exp.title, exp.location, exp.category].map((f: string) => normalizeText(f || "")).join(" ");
        return terms.some(term => termMatches(term, ef));
      });
      return terms.some(term => termMatches(term, fields)) || expMatch;
    });
  }, [searchQuery, categoryItineraries]);

  const hasSearchResults = searchQuery.trim().length > 0;

  const cityLabel = selectedCity || "your city";
  const catLabel = activeCategory ? categoryLabelMap[activeCategory] || activeCategory : "";

  // Row title helper
  const rowTitle = (base: string, catOverride?: string) => {
    if (activeCategory && catOverride) return catOverride;
    return base;
  };

  const headerContent = selectedCity ? (
    <button
      onClick={() => handleCityChange("")}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
    >
      <MapPin className="w-3 h-3" />
      {selectedCity}
      <span className="ml-0.5 text-primary/60">✕</span>
    </button>
  ) : undefined;

  return (
    <MobileShell headerContent={headerContent} hideAvatar notFixed>
      <MobileSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => { setSearchQuery(q); setSearchOpen(false); }}
      />

      {/* Search bar - Uber Eats style */}
      <div className="px-4 pb-3">
        <button
          onClick={() => navigate("/search")}
          className="w-full flex items-center gap-3 px-4 py-3 bg-muted rounded-full text-left transition-colors duration-150 active:bg-muted/70"
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-[15px] text-muted-foreground flex-1 truncate">
            {searchQuery || rotatingPlaceholders[placeholderIndex]}
          </span>
          {searchQuery && (
            <button
              onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
              className="p-1 rounded-full hover:bg-background/50"
            >
              <span className="text-muted-foreground text-sm">✕</span>
            </button>
          )}
        </button>
      </div>

      {/* Category filter pills */}
      <CategoryFilterPills activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* City selector drawer */}
      <Drawer open={cityDrawerOpen} onOpenChange={setCityDrawerOpen}>
        <DrawerContent className="bg-card border-border">
          <div className="px-5 pt-4 pb-8">
            <h2 className="text-lg font-bold text-foreground mb-1">Choose a city</h2>
            <p className="text-sm text-muted-foreground mb-5">Select a city to explore experiences</p>
            <div className="space-y-2.5">
              {mapCities.map((city) => (
                <button
                  key={city.name}
                  disabled={!city.available}
                  onClick={() => city.available && handleCityChange(selectedCity === city.name ? "" : city.name)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                    city.available
                      ? selectedCity === city.name
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-background border border-border/60 active:scale-[0.98]"
                      : "bg-muted/40 border border-border/30 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    city.available ? "bg-primary/10" : "bg-muted"
                  )}>
                    <MapPin className={cn("w-5 h-5", city.available ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-[15px] font-semibold", city.available ? "text-foreground" : "text-muted-foreground")}>
                      {city.name}
                    </h3>
                    {!city.available && city.launchDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">Coming {city.launchDate}</p>
                    )}
                    {city.available && (
                      <p className="text-xs text-primary mt-0.5">Available now</p>
                    )}
                  </div>
                  {city.available && selectedCity === city.name && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Search results */}
      {hasSearchResults ? (
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">
              Results for "{searchQuery}"
            </h2>
            <button onClick={() => setSearchQuery("")} className="text-xs text-primary font-medium">Clear</button>
          </div>
          
          {filteredExperiences.length === 0 && filteredItineraries.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              {filteredItineraries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Itineraries</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItineraries.slice(0, 6).map(it => (
                      <MobileItineraryCard key={it.id} itinerary={it} />
                    ))}
                  </div>
                </div>
              )}
              {filteredExperiences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Experiences</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredExperiences.slice(0, 12).map(exp => (
                      <MobileExperienceCard key={exp.id} experience={exp} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
      <>
      {/* Alternating content - filtered by category */}
      {categoryItineraries.length > 0 && (
        <HorizontalScrollRow 
          title={rowTitle(
            selectedCity ? `Top in ${selectedCity}` : "Attractions you can't miss",
            `${catLabel} you can't miss`
          )}
          variant="itinerary"
          onTitleClick={() => navigate("/itinerary-collections/attractions-you-cant-miss")}
        >
          {categoryItineraries.slice(0, 6).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryExperiences.length > 0 && (
        <HorizontalScrollRow 
          title={rowTitle(
            `Available in ${cityLabel} next weekend`,
            `${catLabel} available next weekend`
          )}
          variant="experience"
          onTitleClick={() => navigate("/experience-collections/available-next-weekend")}
        >
          {categoryExperiences.slice(0, 8).map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryItineraries.length > 3 && (
        <HorizontalScrollRow 
          title={rowTitle("Curated by locals", `${catLabel} curated by locals`)}
          variant="itinerary"
          onTitleClick={() => navigate("/itinerary-collections/curated-by-locals")}
        >
          {categoryItineraries.slice(3, 9).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryExperiences.length > 8 && (
        <HorizontalScrollRow 
          title={rowTitle("Adventure awaits", `More ${catLabel}`)}
          variant="experience"
          onTitleClick={() => navigate("/experience-collections/adventure-awaits")}
        >
          {categoryExperiences.slice(8, 18).map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryItineraries.length > 1 && !activeCategory && (
        <HorizontalScrollRow 
          title="Weekend getaways"
          variant="itinerary"
          onTitleClick={() => navigate("/itinerary-collections/weekend-getaways")}
        >
          {categoryItineraries.slice(1, 7).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryExperiences.length > 18 && (
        <HorizontalScrollRow 
          title={rowTitle("Taste the local flavors", `Even more ${catLabel}`)}
          variant="experience"
          onTitleClick={() => navigate("/experience-collections/taste-local-flavors")}
        >
          {categoryExperiences.slice(18, 28).map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {categoryItineraries.length > 2 && !activeCategory && (
        <HorizontalScrollRow 
          title="Popular this week"
          variant="itinerary"
          onTitleClick={() => navigate("/itinerary-collections/popular-this-week")}
        >
          {categoryItineraries.slice(2, 8).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {/* No results for category */}
      {activeCategory && categoryExperiences.length === 0 && categoryItineraries.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-muted-foreground">No {catLabel.toLowerCase()} found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different category</p>
        </div>
      )}
      </>
      )}
    </MobileShell>
  );
};
