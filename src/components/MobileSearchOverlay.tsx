import { useState, useEffect } from "react";
import { Search, X, Clock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export const MobileSearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
}: MobileSearchOverlayProps) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
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
      // Scroll to top after search
      window.scrollTo({ top: 0 });
      document.querySelector('main')?.scrollTo({ top: 0 });
      onClose();
    }
  };

  const handleRecentClick = (query: string) => {
    onSearchChange(query);
    addToRecentSearches(query);
    onSearch(query);
    // Scroll to top after search
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="What do you want to explore?"
              autoFocus
              className="pl-10 pr-10 py-3 text-base bg-background border border-border/60 rounded-xl focus:ring-1 focus:ring-accent/50 placeholder:text-muted-foreground/60"
              style={{ fontSize: '16px' }} // Prevent iOS zoom
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onSearchChange("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Recent searches</h3>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm text-foreground transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Popular categories</h3>
          <div className="flex flex-wrap gap-2">
            {["Beach", "Party", "Food", "Wildlife", "Adventure", "Water Sports"].map((category) => (
              <button
                key={category}
                onClick={() => handleRecentClick(category)}
                className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-full text-sm font-medium transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Try searching for</h3>
          <div className="space-y-1">
            {[
              "Sunset beach experience",
              "Local food tour",
              "Safari adventure",
              "Water sports near me",
              "Nightlife in Zanzibar"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleRecentClick(suggestion)}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-muted rounded-lg text-left transition-colors"
              >
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
