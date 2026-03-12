import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { Heart, Plus, Layers, MapPin, Search, Check, ChevronRight } from "lucide-react";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";

const filterCategories = [
  { label: "Beaches", category: "Beach", icon: catBeaches },
  { label: "Nightlife", category: "Nightlife", icon: catNightlife },
  { label: "Nature", category: "Wildlife", icon: catNature },
  { label: "Adventure", category: "Adventure", icon: catAdventure },
  { label: "Food", category: "Food", icon: catFood },
  { label: "Safari", category: "Wildlife", icon: catSafari },
];

const rotatingPlaceholders = [
  "Search the best beaches",
  "Search cultural experiences",
  "Search food tours",
  "Search hidden gems",
  "Search sunset spots",
];

// Removed cityDisplayMap - now handled by MobileShell globe button

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
                "w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all overflow-hidden",
                isActive 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "bg-muted"
              )}>
                <img src={cat.icon} alt={cat.label} className="w-9 h-9 object-contain" />
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
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
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

// Static alias map
const cityAliases: Record<string, string[]> = {
  "Zanzibar": ["Zanzibar", "Stone Town", "Kendwa", "Nungwi", "Paje", "Jambiani"],
  "Dar es Salaam": ["Dar es Salaam", "Dar Es Salaam", "Dar"],
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

const allItinerariesData = getPopularItineraries();
const allExpsData = allExperiences;

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
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % rotatingPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q || "");
    const city = searchParams.get("city");
    if (city !== null) setSelectedCity(city);
  }, [searchParams]);

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
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

  const categoryExperiences = useMemo(() => {
    if (!activeCategory) return experiences;
    return experiences.filter(e => e.category === activeCategory);
  }, [experiences, activeCategory]);

  const categoryItineraries = useMemo(() => {
    if (!activeCategory) return itineraries;
    return itineraries.filter(it => 
      it.experiences?.some((e: any) => e.category === activeCategory)
    );
  }, [itineraries, activeCategory]);

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

  const rowTitle = (base: string, catOverride?: string) => {
    if (activeCategory && catOverride) return catOverride;
    return base;
  };

  return (
    <MobileShell hideAvatar notFixed>
      {/* Search bar */}
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
      {/* Alternating content */}
      {categoryItineraries.length > 0 && (
        <HorizontalScrollRow 
          title={rowTitle(
            selectedCity ? `Top in ${selectedCity}` : "Attractions you can't miss",
            `${catLabel} you can't miss`
          )}
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
          onTitleClick={() => navigate("/itinerary-collections/popular-this-week")}
        >
          {categoryItineraries.slice(2, 8).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

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