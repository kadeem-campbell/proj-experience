import { useState, useEffect } from "react";
import { Search, X, Clock, ArrowLeft, MapPin, Compass, Sparkles, TrendingUp } from "lucide-react";
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
      window.scrollTo({ top: 0 });
      document.querySelector('main')?.scrollTo({ top: 0 });
      onClose();
    }
  };

  const handleRecentClick = (query: string) => {
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

  // Recommended experiences/destinations
  const recommendations = [
    { icon: "🏝️", title: "Zanzibar Beaches", subtitle: "Crystal clear waters" },
    { icon: "🦁", title: "Safari Adventures", subtitle: "Wildlife encounters" },
    { icon: "🍽️", title: "Food Tours", subtitle: "Local cuisine" },
    { icon: "🌅", title: "Sunset Experiences", subtitle: "Golden hour magic" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
      {/* Search Header - Premium feel */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 -ml-2 h-10 w-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="What do you want to explore?"
              autoFocus
              className="pl-12 pr-10 py-3.5 text-base bg-muted/50 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
              style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Recent searches</h3>
              <button
                onClick={clearRecentSearches}
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground font-medium">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommended - Premium cards */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Recommended</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recommendations.map((rec, index) => (
              <button
                key={index}
                onClick={() => handleRecentClick(rec.title)}
                className="flex flex-col items-start p-4 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-2xl mb-2">{rec.icon}</span>
                <span className="text-sm font-semibold text-foreground">{rec.title}</span>
                <span className="text-xs text-muted-foreground">{rec.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Categories */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Categories</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Beach", "Party", "Food", "Wildlife", "Adventure", "Culture", "Water Sports", "Nightlife"].map((category) => (
              <button
                key={category}
                onClick={() => handleRecentClick(category)}
                className="px-4 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-full text-sm font-medium transition-colors border border-border/20"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Searches */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Trending now</h3>
          </div>
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
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-foreground">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};