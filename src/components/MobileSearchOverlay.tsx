import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

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

const trendingSearches = [
  "sunset cruise", "zanzibar beaches", "safari tour",
  "local food", "snorkeling", "nightlife",
  "spice tour", "jozani forest",
];

export const MobileSearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
}: MobileSearchOverlayProps) => {
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
      {/* Search input - prominent */}
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
      <div className="flex-1 overflow-y-auto" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Your history */}
        {recentSearches.length > 0 && (
          <div className="mt-5 mb-6">
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

        {/* Trending searches */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-foreground mb-3">Trending searches</h3>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                className="px-3.5 py-2 rounded-full bg-muted/40 border border-border/40 text-sm text-foreground hover:bg-muted transition-colors duration-150"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
