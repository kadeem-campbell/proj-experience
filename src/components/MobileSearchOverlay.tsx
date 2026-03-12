import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Layers, Heart, MapPin, Plus, SlidersHorizontal, Check } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/hooks/useIOSKeyboard";
import { useNavigate } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { allExperiences } from "@/hooks/useExperiencesData";
import { getPopularItineraries } from "@/data/itinerariesData";
import { cn } from "@/lib/utils";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  initialCity?: string;
  onCityChange?: (city: string) => void;
}

const categoryToSearchCategory: Record<string, string> = {
  "Beaches": "Beach",
  "Nightlife": "Nightlife",
  "Nature": "Wildlife",
  "Adventure": "Adventure",
  "Food": "Food",
  "Safari": "Wildlife",
};

const RECENT_SEARCHES_KEY = "guiduuid_recent_searches";
const MAX_RECENT_SEARCHES = 8;

const filterCategories = [
  { label: "Beaches", category: "Beach" },
  { label: "Nightlife", category: "Nightlife" },
  { label: "Nature", category: "Wildlife" },
  { label: "Adventure", category: "Adventure" },
  { label: "Food", category: "Food" },
  { label: "Safari", category: "Wildlife" },
];

const filterLocations = [
  { label: "🇹🇿 Zanzibar", value: "Zanzibar" },
  { label: "🇹🇿 Dar es Salaam", value: "Dar es Salaam" },
];

const allItinerariesData = getPopularItineraries();
const allExpsData = allExperiences;

const normalize = (text: string) => text.toLowerCase().replace(/[-_&]/g, " ").replace(/\s+/g, " ").trim();
const stem = (word: string) => word.replace(/(es|s|ing|ed)$/i, "");
const termMatch = (term: string, field: string) => {
  if (field.includes(term)) return true;
  const s = stem(term);
  if (s.length > 2 && field.includes(s)) return true;
  return field.split(" ").some(w => w.startsWith(term) || (s.length > 2 && w.startsWith(s)));
};

// Vertical card for search results - itinerary
const SearchItineraryCard = ({ itinerary, onNavigate }: { itinerary: any; onNavigate: () => void }) => {
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
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-itinerary-color/20 to-itinerary-color/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-itinerary-color/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked ? "bg-experience-color/20" : "bg-white/80"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-experience-color text-experience-color" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-xl shadow-sm flex items-center gap-1 bg-white/80">
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{itinerary.creatorName || 'Local Creator'}</p>
      </div>
    </div>
  );
};

// Vertical card for search results - experience
const SearchExperienceCard = ({ experience, onNavigate }: { experience: any; onNavigate: () => void }) => {
  const [localLiked, setLocalLiked] = useState(false);
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

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-experience-color/20 to-experience-color/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked ? "bg-experience-color/20" : "bg-white/80"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-experience-color text-experience-color" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ItinerarySelector
            experienceId={experience.id}
            experienceData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
          >
            <button className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm bg-white/80 active:scale-90">
              <Plus className="w-4 h-4 text-foreground" />
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
      </div>
    </div>
  );
};

export const MobileSearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
  initialCity,
  onCityChange,
}: MobileSearchOverlayProps) => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "experiences" | "itineraries">("all");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Pre-select city location filter from global city state
  useEffect(() => {
    if (isOpen && initialCity) {
      setSelectedLocations(prev => {
        if (prev.includes(initialCity)) return prev;
        return [initialCity];
      });
    }
  }, [isOpen, initialCity]);

  const savedScrollRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      savedScrollRef.current = lockBodyScroll();
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleKey);
      return () => {
        unlockBodyScroll(savedScrollRef.current);
        window.removeEventListener('keydown', handleKey);
      };
    } else {
      unlockBodyScroll(savedScrollRef.current);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch { setRecentSearches([]); }
    }
  }, [isOpen]);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [
      query.trim(),
      ...recentSearches.filter(s => s.toLowerCase() !== query.trim().toLowerCase())
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const q = normalize(searchQuery);
  const terms = q.split(" ").filter(t => t.length > 1);
  const hasQuery = terms.length > 0 || activeCategory !== "";

  const liveExperiences = useMemo(() => {
    let filtered = allExpsData;
    if (activeCategory) {
      const mappedCat = categoryToSearchCategory[activeCategory] || activeCategory;
      filtered = filtered.filter(e => e.category === mappedCat);
    }
    if (terms.length > 0) {
      filtered = filtered.filter(e => {
        const fields = normalize([e.title, e.location, e.category, e.creator].join(" "));
        return terms.some(t => termMatch(t, fields));
      });
    }
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(e =>
        selectedLocations.some(loc => (e.location || '').toLowerCase().includes(loc.toLowerCase()))
      );
    }
    return filtered;
  }, [q, activeCategory, selectedLocations]);

  const liveItineraries = useMemo(() => {
    let filtered = allItinerariesData;
    if (activeCategory) {
      const mappedCat = categoryToSearchCategory[activeCategory] || activeCategory;
      filtered = filtered.filter(it =>
        it.experiences?.some((exp: any) => exp.category === mappedCat)
      );
    }
    if (terms.length > 0) {
      filtered = filtered.filter(it => {
        const fields = normalize([it.name, it.creatorName].join(" "));
        const expMatch = it.experiences?.some((exp: any) => {
          const ef = normalize([exp.title, exp.location, exp.category].join(" "));
          return terms.some(t => termMatch(t, ef));
        });
        return terms.some(t => termMatch(t, fields)) || expMatch;
      });
    }
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(it =>
        it.experiences?.some((exp: any) =>
          selectedLocations.some(loc => (exp.location || '').toLowerCase().includes(loc.toLowerCase()))
        )
      );
    }
    return filtered;
  }, [q, activeCategory, selectedLocations]);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
    }
    inputRef.current?.blur();
  };

  const handleQuickSearch = (query: string) => {
    onSearchChange(query);
    addToRecentSearches(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleNavigate = (path: string) => {
    addToRecentSearches(searchQuery);
    onClose();
    navigate(path);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const toggleCategory = (label: string) => {
    setActiveCategory(prev => prev === label ? "" : label);
  };

  const activeFilterCount = (typeFilter !== "all" ? 1 : 0) + selectedLocations.length + (activeCategory ? 1 : 0);

  const showExperiences = typeFilter === "all" || typeFilter === "experiences";
  const showItineraries = typeFilter === "all" || typeFilter === "itineraries";

  // Scroll to top helper
  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] bg-background animate-in fade-in duration-150"
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', touchAction: 'none' }}
    >
      {/* Fixed header: search + filter */}
      <div className="shrink-0">
        <div className="px-4 pt-[calc(env(safe-area-inset-top,8px)+12px)] pb-3">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center bg-muted rounded-full px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground mr-2.5 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Find experiences, food, or places"
                  autoFocus
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground/50"
                  style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => onSearchChange("")} className="p-1 rounded-full shrink-0" style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {/* Filter button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "relative p-3 rounded-full shrink-0 transition-colors",
                  showFilters || activeFilterCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center min-w-[18px] h-[18px]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button type="button" onClick={onClose} className="text-sm font-medium text-primary shrink-0" style={{ WebkitTapHighlightColor: 'transparent' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-4 pb-3 border-b border-border/30 animate-in slide-in-from-top-2 duration-200">
            {/* Type filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Show</p>
              <div className="flex gap-2">
                {(["all", "experiences", "itineraries"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all capitalize",
                      typeFilter === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {type === "all" ? "All" : type === "experiences" ? "Experiences" : "Itineraries"}
                  </button>
                ))}
              </div>
            </div>
            {/* Location filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</p>
              <div className="flex gap-2">
                {filterLocations.map(loc => {
                  const isActive = selectedLocations.includes(loc.value);
                  return (
                    <button
                      key={loc.value}
                      onClick={() => toggleLocation(loc.value)}
                      className={cn(
                        "flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isActive && <Check className="w-3 h-3" />}
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Category filter */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {filterCategories.map(cat => {
                  const isActive = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => toggleCategory(cat.label)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTypeFilter("all"); setSelectedLocations([]); setActiveCategory(""); }}
                className="mt-1 text-xs text-primary font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content area - vertical infinite scroll */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.search-scroll-hide::-webkit-scrollbar { display: none; }`}</style>

        {hasQuery ? (
          <div className="px-4 pb-8">
            {/* Itineraries section */}
            {showItineraries && liveItineraries.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Itineraries</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveItineraries.map(it => (
                    <SearchItineraryCard
                      key={it.id}
                      itinerary={it}
                      onNavigate={() => handleNavigate(`/itineraries/${it.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Experiences section */}
            {showExperiences && liveExperiences.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Experiences</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveExperiences.map(exp => (
                    <SearchExperienceCard
                      key={exp.id}
                      experience={exp}
                      onNavigate={() => handleNavigate(`/experiences/${slugify(exp.title)}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {liveExperiences.length === 0 && liveItineraries.length === 0 && (
              <div className="text-center py-12 px-4">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4">
            {recentSearches.length > 0 && (
              <div className="mt-3 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">Your history</h3>
                  <button onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(search)}
                      className="px-3.5 py-2 rounded-full bg-muted/40 border border-border/40 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show all content when no query - vertical grid */}
            <div className="py-3">
              <h2 className="text-[15px] font-bold text-foreground mb-3">Explore</h2>
              <div className="grid grid-cols-2 gap-3">
                {(showExperiences ? allExpsData.slice(0, 8) : []).map(exp => (
                  <SearchExperienceCard
                    key={exp.id}
                    experience={exp}
                    onNavigate={() => handleNavigate(`/experiences/${slugify(exp.title)}`)}
                  />
                ))}
                {(showItineraries ? allItinerariesData.slice(0, 4) : []).map(it => (
                  <SearchItineraryCard
                    key={it.id}
                    itinerary={it}
                    onNavigate={() => handleNavigate(`/itineraries/${it.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};