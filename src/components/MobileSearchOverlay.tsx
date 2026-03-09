import { useState, useEffect, useMemo } from "react";
import { Search, X, Layers, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { allExperiences } from "@/hooks/useExperiencesData";
import { getPopularItineraries } from "@/data/itinerariesData";
import { cn } from "@/lib/utils";

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

export const MobileSearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
}: MobileSearchOverlayProps) => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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

  // Live filtered results as user types
  const q = normalize(searchQuery);
  const terms = q.split(" ").filter(t => t.length > 1);
  const hasQuery = terms.length > 0;

  const liveExperiences = useMemo(() => {
    if (!hasQuery) return [];
    return allExpsData.filter(e => {
      const fields = normalize([e.title, e.location, e.category, e.creator].join(" "));
      return terms.some(t => termMatch(t, fields));
    }).slice(0, 6);
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
    }).slice(0, 4);
  }, [q]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-in fade-in duration-150">
      {/* Search input */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top,8px)+12px)] pb-3">
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
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="p-2 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-primary px-2 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {hasQuery ? (
          <>
            {/* Live experience results */}
            {liveExperiences.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Experiences</h3>
                <div className="space-y-1">
                  {liveExperiences.map(exp => (
                    <button
                      key={exp.id}
                      onClick={() => { addToRecentSearches(searchQuery); onClose(); navigate(`/experience/${exp.id}`); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img src={exp.videoThumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{exp.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{exp.location} · {exp.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-foreground shrink-0">{exp.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live itinerary results */}
            {liveItineraries.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Itineraries</h3>
                <div className="space-y-1">
                  {liveItineraries.map(it => (
                    <button
                      key={it.id}
                      onClick={() => { addToRecentSearches(searchQuery); onClose(); navigate(`/itineraries/${it.id}`); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                        {it.coverImage || it.experiences?.[0]?.videoThumbnail ? (
                          <img src={it.coverImage || it.experiences?.[0]?.videoThumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {it.creatorName} · {it.experiences?.length || 0} experiences
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {liveExperiences.length === 0 && liveItineraries.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
              </div>
            )}

            {/* Press enter hint */}
            {(liveExperiences.length > 0 || liveItineraries.length > 0) && (
              <button
                onClick={handleSubmit as any}
                className="w-full py-3 text-center text-sm font-medium text-primary"
              >
                See all results for "{searchQuery}"
              </button>
            )}
          </>
        ) : (
          <>
            {/* Your history */}
            {recentSearches.length > 0 && (
              <div className="mt-3 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">Your history</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
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

            {/* Search by category */}
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
          </>
        )}
      </div>
    </div>
  );
};
