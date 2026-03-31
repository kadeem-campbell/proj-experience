import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, X, Layers, Heart, MapPin, Plus, Check, Sparkles, Send, ArrowLeft, Loader2 } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/hooks/useIOSKeyboard";
import { useNavigate, useLocation } from "react-router-dom";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { useProductListings } from "@/hooks/useProductListings";
import { usePopularItineraries } from "@/hooks/usePublicItineraries";
import { cn } from "@/lib/utils";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { supabase } from "@/integrations/supabase/client";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  initialCity?: string;
  onCityChange?: (city: string) => void;
}

const RECENT_SEARCHES_KEY = "guiduuid_recent_searches";
const MAX_RECENT_SEARCHES = 8;

const normalize = (text: string) => text.toLowerCase().replace(/[-_&]/g, " ").replace(/\s+/g, " ").trim();
const stem = (word: string) => word.replace(/(es|s|ing|ed)$/i, "");

const scoreMatch = (terms: string[], item: { title: string; location?: string; category?: string; creator?: string; description?: string }) => {
  const titleNorm = normalize(item.title || "");
  const locationNorm = normalize(item.location || "");
  const categoryNorm = normalize(item.category || "");
  const descNorm = normalize(item.description || "");
  let score = 0;
  for (const term of terms) {
    const s = stem(term);
    if (titleNorm.includes(term)) score += 100;
    else if (s.length > 2 && titleNorm.includes(s)) score += 80;
    if (locationNorm.includes(term)) score += 40;
    if (categoryNorm.includes(term)) score += 30;
    if (descNorm.includes(term)) score += 15;
  }
  return score;
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
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', { id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage, creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3) });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Layers className="w-8 h-8 text-primary/40" /></div>
        )}
        <button onClick={handleLikeClick} className={cn("absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90", liked ? "bg-primary/20" : "bg-white/80")}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-xl shadow-sm flex items-center gap-1 bg-white/80">
          <Layers className="w-3 h-3 text-foreground" /><span className="text-xs font-medium text-foreground">{experienceCount}</span>
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
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', { id: experience.id, title: experience.title, videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5" />}
        <button onClick={handleLikeClick} className={cn("absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90", liked ? "bg-accent/20" : "bg-white/80")}>
          <Heart className={cn("w-4 h-4", liked ? "fill-accent text-accent" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <ItinerarySelector experienceId={experience.id} experienceData={{ id: experience.id, title: experience.title, creator: experience.creator || '', videoThumbnail: experience.videoThumbnail || '', category: experience.category || '', location: experience.location || '', price: experience.price || '' }}>
            <button className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm bg-white/80 active:scale-90" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <Plus className="w-4 h-4 text-foreground" />
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" /><span className="truncate">{experience.location}</span>
        </div>
      </div>
    </div>
  );
};

export const MobileSearchOverlay = ({
  isOpen, onClose, searchQuery, onSearchChange, onSearch, initialCity, onCityChange,
}: MobileSearchOverlayProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  // No default filter selected — user can toggle either on/off
  const [typeFilter, setTypeFilter] = useState<"experiences" | "itineraries" | null>(null);
  const { data: allItinerariesData = [] } = usePopularItineraries();
  const allExpsData = useProductListings();
  const isDedicatedSearchRoute = location.pathname === "/search" || location.pathname === "/discover";

  // AI state — integrated into main search
  const [aiSummary, setAiSummary] = useState("");
  const [aiProducts, setAiProducts] = useState<any[]>([]);
  const [aiItineraries, setAiItineraries] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTriggered, setAiTriggered] = useState(false);

  const savedScrollRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      savedScrollRef.current = lockBodyScroll();
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleKey);
      return () => { unlockBodyScroll(savedScrollRef.current); window.removeEventListener('keydown', handleKey); };
    } else { unlockBodyScroll(savedScrollRef.current); }
  }, [isOpen, onClose]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) { try { setRecentSearches(JSON.parse(stored)); } catch { setRecentSearches([]); } }
  }, [isOpen]);

  // Reset AI state when search changes
  useEffect(() => {
    setAiTriggered(false);
    setAiSummary("");
    setAiProducts([]);
    setAiItineraries([]);
  }, [searchQuery]);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [query.trim(), ...recentSearches.filter(s => s.toLowerCase() !== query.trim().toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const q = normalize(searchQuery);
  const terms = q.split(" ").filter(t => t.length > 1);
  const hasQuery = terms.length > 0;

  // Filtered results
  const liveExperiences = useMemo(() => {
    if (terms.length === 0) return allExpsData;
    return allExpsData
      .map(e => ({ item: e, score: scoreMatch(terms, e) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.item);
  }, [allExpsData, q]);

  const liveItineraries = useMemo(() => {
    if (terms.length === 0) return allItinerariesData;
    return allItinerariesData.filter(it => {
      const fields = normalize([it.name, it.creatorName].join(" "));
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = normalize([exp.title, exp.location].join(" "));
        return terms.some(t => ef.includes(t) || (stem(t).length > 2 && ef.includes(stem(t))));
      });
      return terms.some(t => fields.includes(t) || (stem(t).length > 2 && fields.includes(stem(t)))) || expMatch;
    });
  }, [allItinerariesData, q]);

  const showExperiences = typeFilter === null || typeFilter === "experiences";
  const showItineraries = typeFilter === null || typeFilter === "itineraries";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) addToRecentSearches(searchQuery);
    inputRef.current?.blur();
  };

  const handleQuickSearch = (query: string) => { onSearchChange(query); addToRecentSearches(query); };

  const clearRecentSearches = () => { setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); };

  const experiencePath = (experience: any) => generateProductPageUrl(experience.location || '', experience.title || '', experience.slug);
  const itineraryPath = (itinerary: any) => `/itineraries/${itinerary.slug || itinerary.id}`;

  const handleNavigate = (path: string) => {
    addToRecentSearches(searchQuery);
    if (!isDedicatedSearchRoute) onClose();
    navigate(path);
  };

  const toggleTypeFilter = (type: "experiences" | "itineraries") => {
    setTypeFilter(prev => prev === type ? null : type);
  };

  // AI search
  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setAiLoading(true);
    setAiTriggered(true);
    addToRecentSearches(searchQuery);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', { body: { query: searchQuery } });
      if (error) throw error;
      setAiSummary(data.summary || "");
      setAiProducts(data.products || []);
      setAiItineraries(data.itineraries || []);
    } catch (err) {
      console.error("AI search error:", err);
      setAiSummary("Sorry, I couldn't search right now. Try again!");
    } finally { setAiLoading(false); }
  };

  // Determine if query looks semantic (3+ words or contains natural language patterns)
  const isSemanticQuery = terms.length >= 3 || /\b(find|show|best|top|romantic|cheap|luxury|family|couple|adventure)\b/i.test(searchQuery);

  if (!isOpen) return null;

  const noLocalResults = hasQuery && liveExperiences.length === 0 && liveItineraries.length === 0;

  return (
    <div className="fixed inset-0 z-[55] bg-background animate-in fade-in duration-150" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
      {/* Fixed header */}
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
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Search experiences & itineraries"
                  autoFocus
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground/50"
                  style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => onSearchChange("")} className="p-1 rounded-full shrink-0">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {/* Filter pills inline with cancel */}
              <button type="button" onClick={onClose} className="text-sm font-medium text-primary shrink-0">Cancel</button>
            </div>
          </form>
        </div>

        {/* Filter row — separate from search, own row */}
        <div className="px-4 pb-2 flex items-center gap-2">
          {(["experiences", "itineraries"] as const).map(type => (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                typeFilter === type
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {type === "experiences" ? "Experiences" : "Itineraries"}
            </button>
          ))}
          {/* AI search button */}
          {hasQuery && !aiTriggered && (
            <button
              onClick={handleAiSearch}
              className="shrink-0 ml-auto px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </button>
          )}
          {aiLoading && (
            <div className="shrink-0 ml-auto px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        {/* AI Summary inline */}
        {aiSummary && (
          <div className="px-4 py-3">
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm text-foreground leading-relaxed max-w-[85%]">
                {aiSummary}
              </div>
            </div>
          </div>
        )}

        {/* AI recommended results */}
        {aiProducts.length > 0 && showExperiences && (
          <div className="px-4 py-2">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">AI Recommended</h3>
            <div className="grid grid-cols-2 gap-3">
              {aiProducts.map((p: any) => (
                <SearchExperienceCard
                  key={p.id}
                  experience={{ id: p.id, title: p.title, videoThumbnail: p.image, location: p.destination, slug: p.slug, price: p.price ? `$${p.price}` : '', category: '', creator: '' }}
                  onNavigate={() => handleNavigate(generateProductPageUrl(p.destination || '', p.title, p.slug))}
                />
              ))}
            </div>
          </div>
        )}
        {aiItineraries.length > 0 && showItineraries && (
          <div className="px-4 py-2">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">AI Recommended Itineraries</h3>
            <div className="grid grid-cols-2 gap-3">
              {aiItineraries.map((i: any) => (
                <SearchItineraryCard key={i.id} itinerary={{ id: i.id, name: i.name, slug: i.slug, coverImage: i.image, experiences: [] }} onNavigate={() => handleNavigate(`/itineraries/${i.slug || i.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Regular search results */}
        {hasQuery ? (
          <div className="px-4 pb-8">
            {/* Semantic hint — auto-trigger AI for natural language queries */}
            {isSemanticQuery && !aiTriggered && !aiLoading && (
              <button onClick={handleAiSearch} className="w-full mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 flex items-center gap-3 active:scale-[0.98] transition-transform">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-foreground text-left">Looks like a discovery query — <span className="text-primary font-semibold">tap to ask AI</span></p>
              </button>
            )}

            {showItineraries && liveItineraries.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Itineraries</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveItineraries.map(it => <SearchItineraryCard key={it.id} itinerary={it} onNavigate={() => handleNavigate(itineraryPath(it))} />)}
                </div>
              </div>
            )}

            {showExperiences && liveExperiences.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Experiences</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveExperiences.map(exp => <SearchExperienceCard key={exp.id} experience={exp} onNavigate={() => handleNavigate(experiencePath(exp))} />)}
                </div>
              </div>
            )}

            {noLocalResults && !aiTriggered && (
              <div className="text-center py-12 px-4">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <button onClick={handleAiSearch} className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />Try AI Search
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4">
            {/* AI CTA */}
            <button onClick={() => { if (searchQuery.trim()) handleAiSearch(); }} className="w-full mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-primary" /></div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-foreground">Ask AI to find experiences</p>
                <p className="text-xs text-muted-foreground mt-0.5">"Find me a romantic beach thing in Zanzibar"</p>
              </div>
            </button>

            {recentSearches.length > 0 && (
              <div className="mt-3 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">Your history</h3>
                  <button onClick={clearRecentSearches} className="text-xs text-muted-foreground">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button key={index} onClick={() => handleQuickSearch(search)} className="px-3.5 py-2 rounded-full bg-muted/40 border border-border/40 text-sm text-foreground">{search}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Default: show explore grid */}
            <div className="py-3">
              <h2 className="text-[15px] font-bold text-foreground mb-3">Explore</h2>
              <div className="grid grid-cols-2 gap-3">
                {(showExperiences ? allExpsData.slice(0, 8) : []).map(exp => (
                  <SearchExperienceCard key={exp.id} experience={exp} onNavigate={() => handleNavigate(experiencePath(exp))} />
                ))}
                {(showItineraries ? allItinerariesData.slice(0, 4) : []).map(it => (
                  <SearchItineraryCard key={it.id} itinerary={it} onNavigate={() => handleNavigate(itineraryPath(it))} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
