import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Layers, Heart, MapPin, Plus } from "lucide-react";
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
}

const RECENT_SEARCHES_KEY = "guiduuid_recent_searches";
const MAX_RECENT_SEARCHES = 8;

const categories = [
  { emoji: "🏖️", label: "Beaches" },
  { emoji: "📍", label: "Excursions" },
  { emoji: "🍽️", label: "Food & Drink" },
  { emoji: "🎉", label: "Nightlife" },
  { emoji: "🦁", label: "Wildlife" },
  { emoji: "🏄", label: "Water Sports" },
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

// Horizontal scroll row for search results
const SearchHorizontalRow = ({ title, variant = "default", children }: {
  title: string;
  variant?: "itinerary" | "experience" | "default";
  children: React.ReactNode;
}) => {
  
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-1.5 px-4">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        
      </div>
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card for search results
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
    <div className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
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

// Experience card for search results
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
    <div className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
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
}: MobileSearchOverlayProps) => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const savedScrollRef = useRef(0);

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
  const hasQuery = terms.length > 0;

  const liveExperiences = useMemo(() => {
    if (!hasQuery) return [];
    return allExpsData.filter(e => {
      const fields = normalize([e.title, e.location, e.category, e.creator].join(" "));
      return terms.some(t => termMatch(t, fields));
    });
  }, [q]);

  const liveItineraries = useMemo(() => {
    if (!hasQuery) return [];
    return allItinerariesData.filter(it => {
      const fields = normalize([it.name, it.creatorName].join(" "));
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = normalize([exp.title, exp.location, exp.category].join(" "));
        return terms.some(t => termMatch(t, ef));
      });
      return terms.some(t => termMatch(t, fields)) || expMatch;
    });
  }, [q]);

  // More from the same category as top result
  const relatedExperiences = useMemo(() => {
    if (!hasQuery || liveExperiences.length === 0) return [];
    const firstCategory = liveExperiences[0]?.category;
    if (!firstCategory) return [];
    return allExpsData
      .filter(e => e.category === firstCategory && !liveExperiences.find(le => le.id === e.id))
      .slice(0, 10);
  }, [liveExperiences, hasQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
      onSearch(searchQuery);
      window.scrollTo({ top: 0 });
      document.querySelector('main')?.scrollTo({ top: 0 });
      onClose();
    }
  };

  const handleQuickSearch = (query: string) => {
    onSearchChange(query);
    addToRecentSearches(query);
    onSearch(query);
    window.scrollTo({ top: 0 });
    document.querySelector('main')?.scrollTo({ top: 0 });
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-background flex flex-col animate-in fade-in duration-150">
      {/* Search input - always fixed at top */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top,8px)+12px)] pb-3 shrink-0">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Find experiences, food, or places"
              autoFocus
              className="w-full pl-12 pr-20 py-4 text-base bg-muted/30 border border-border rounded-2xl outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50 text-foreground"
              style={{ fontSize: '16px' }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button type="button" onClick={() => onSearchChange("")} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button type="button" onClick={onClose} className="text-sm font-medium text-primary px-2 py-1">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain search-scroll-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.search-scroll-hide::-webkit-scrollbar { display: none; }`}</style>
        {hasQuery ? (
          <>
            {/* Featured Itineraries row */}
            {liveItineraries.length > 0 && (
              <SearchHorizontalRow title="Featured Itineraries" variant="itinerary">
                {liveItineraries.map(it => (
                  <SearchItineraryCard
                    key={it.id}
                    itinerary={it}
                    onNavigate={() => handleNavigate(`/itineraries/${it.id}`)}
                  />
                ))}
              </SearchHorizontalRow>
            )}

            {/* Featured Experiences row */}
            {liveExperiences.length > 0 && (
              <SearchHorizontalRow title="Featured Experiences" variant="experience">
                {liveExperiences.map(exp => (
                  <SearchExperienceCard
                    key={exp.id}
                    experience={exp}
                    onNavigate={() => handleNavigate(`/experiences/${slugify(exp.title)}`)}
                  />
                ))}
              </SearchHorizontalRow>
            )}

            {/* Related - more from same category */}
            {relatedExperiences.length > 0 && (
              <SearchHorizontalRow title={`More ${liveExperiences[0]?.category || 'Like This'}`} variant="experience">
                {relatedExperiences.map(exp => (
                  <SearchExperienceCard
                    key={exp.id}
                    experience={exp}
                    onNavigate={() => handleNavigate(`/experiences/${slugify(exp.title)}`)}
                  />
                ))}
              </SearchHorizontalRow>
            )}

            {liveExperiences.length === 0 && liveItineraries.length === 0 && (
              <div className="text-center py-12 px-4">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
              </div>
            )}

            {(liveExperiences.length > 0 || liveItineraries.length > 0) && (
              <div className="px-4 pb-6 pt-2">
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      addToRecentSearches(searchQuery);
                      onSearch(searchQuery);
                      window.scrollTo({ top: 0 });
                      document.querySelector('main')?.scrollTo({ top: 0 });
                      onClose();
                    }
                  }}
                  className="w-full py-3 text-center text-sm font-medium text-primary"
                >
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </>
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

            <div className="mb-6">
              <h3 className="text-base font-bold text-foreground mb-3">Search by category</h3>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => handleQuickSearch(cat.label)}
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-background border border-border hover:bg-muted/40 transition-colors duration-150 text-left"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs font-medium text-foreground truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
