import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Layers, Heart, MapPin, Plus, Map as MapIcon, ChevronDown } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/hooks/useIOSKeyboard";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { useProductListings } from "@/hooks/useProductListings";
import { usePopularItineraries } from "@/hooks/usePublicItineraries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { useDestinations, type DbDestination } from "@/hooks/useAppData";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const isSvg = (s: string) => /^https?:\/\//.test(s) && /\.svg(\?|$)/i.test(s);
const normalizeCity = (v: string) => v.trim().toLowerCase();
const getPersistedCity = (): string => { try { return localStorage.getItem("swam_selected_city") || ""; } catch { return ""; } };
const persistCity = (city: string) => { try { if (city) localStorage.setItem("swam_selected_city", city); else localStorage.removeItem("swam_selected_city"); } catch {} };

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

const scoreMatch = (terms: string[], item: { title?: string; name?: string; location?: string; category?: string; creator?: string; description?: string }) => {
  const titleNorm = normalize(item.title || item.name || "");
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

// ─── Itinerary card ─────────────────────────────────────
const SearchItineraryCard = ({ itinerary, onNavigate }: { itinerary: any; onNavigate: () => void }) => {
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', { id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage, creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3) });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
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

// ─── Experience card ────────────────────────────────────
const SearchExperienceCard = ({ experience, onNavigate }: { experience: any; onNavigate: () => void }) => {
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', { id: experience.id, title: experience.title, videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
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

// ─── Place (POI) card ───────────────────────────────────
const SearchPlaceCard = ({ poi, onNavigate }: { poi: any; onNavigate: () => void }) => {
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const liked = isAuthenticated ? isDbLiked(poi.id, 'poi') : localLiked;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(poi.id, 'poi', { id: poi.id, name: poi.name, slug: poi.slug, cover_image: poi.cover_image, poi_type: poi.poi_type });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onNavigate}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
        {poi.cover_image ? <img src={poi.cover_image} alt={poi.name} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><MapPin className="w-7 h-7 text-muted-foreground/30" /></div>
        )}
        <button onClick={handleLikeClick} className={cn("absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90", liked ? "bg-primary/20" : "bg-white/80")}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-xl shadow-sm flex items-center gap-1 bg-white/80">
          <MapPin className="w-3 h-3 text-foreground" /><span className="text-xs font-medium text-foreground capitalize">{poi.poi_type || 'place'}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{poi.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{poi.destination_name || ''}</p>
      </div>
    </div>
  );
};

type FilterType = "experiences" | "itineraries" | "places";

export const MobileSearchOverlay = ({
  isOpen, onClose, searchQuery, onSearchChange,
}: MobileSearchOverlayProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<FilterType | null>(null);
  const { data: allItinerariesData = [] } = usePopularItineraries();
  const allExpsData = useProductListings();
  const { data: allDestinations = [] } = useDestinations();
  const isDedicatedSearchRoute = location.pathname === "/search" || location.pathname === "/discover";

  // City filter — adopt pre-selection from URL ?city= or persisted localStorage; blank otherwise
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get("city") || getPersistedCity() || "");
  const [citySheetOpen, setCitySheetOpen] = useState(false);

  // Re-sync when overlay re-opens
  useEffect(() => {
    if (isOpen) setSelectedCity(searchParams.get("city") || getPersistedCity() || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selectableCities = useMemo(
    () => allDestinations.filter((d: DbDestination) => d.launch_status === 'live'),
    [allDestinations]
  );
  const comingSoonCities = useMemo(
    () => allDestinations.filter((d: DbDestination) => d.launch_status !== 'live'),
    [allDestinations]
  );
  const selectedCityData = useMemo(
    () => selectableCities.find((d: DbDestination) => normalizeCity(d.name) === normalizeCity(selectedCity)) || null,
    [selectableCities, selectedCity]
  );

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    persistCity(city);
    const next = new URLSearchParams(searchParams);
    if (city) next.set("city", city); else next.delete("city");
    setSearchParams(next, { replace: true });
    // Notify other listeners (MobileShell, MobileHomeView) that city changed
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: 'swam_selected_city', newValue: city || null }));
      window.dispatchEvent(new CustomEvent('swam:city-changed', { detail: { city } }));
    } catch {}
  };

  // Fetch POIs (places)
  const { data: allPois = [] } = useQuery({
    queryKey: ["search-pois"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pois")
        .select("id, name, slug, poi_type, cover_image, destination_id, destinations(name, slug)")
        .eq("is_active", true)
        .order("name");
      return (data || []).map((p: any) => ({
        ...p,
        destination_name: p.destinations?.name || '',
        destination_slug: p.destinations?.slug || '',
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

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

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [query.trim(), ...recentSearches.filter(s => s.toLowerCase() !== query.trim().toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const q = normalize(searchQuery);
  const terms = q.split(" ").filter(t => t.length > 1);
  const hasQuery = terms.length > 0;
  const cityNorm = normalizeCity(selectedCity);
  const cityId = selectedCityData?.id || null;

  // City-scoped pools
  const cityScopedExps = useMemo(() => {
    if (!cityNorm) return allExpsData;
    return allExpsData.filter((e: any) =>
      (e.destinationId && cityId && e.destinationId === cityId) ||
      normalizeCity(e.location || '').includes(cityNorm)
    );
  }, [allExpsData, cityNorm, cityId]);

  const cityScopedItins = useMemo(() => {
    if (!cityNorm) return allItinerariesData;
    return allItinerariesData.filter((it: any) =>
      normalizeCity(it.name || '').includes(cityNorm) ||
      it.experiences?.some((e: any) => normalizeCity(e.location || '').includes(cityNorm))
    );
  }, [allItinerariesData, cityNorm]);

  const cityScopedPois = useMemo(() => {
    if (!cityNorm) return allPois;
    return allPois.filter((p: any) =>
      (cityId && p.destination_id === cityId) ||
      normalizeCity(p.destination_name || '').includes(cityNorm)
    );
  }, [allPois, cityNorm, cityId]);

  const liveExperiences = useMemo(() => {
    if (terms.length === 0) return cityScopedExps;
    return cityScopedExps
      .map(e => ({ item: e, score: scoreMatch(terms, e) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.item);
  }, [cityScopedExps, q]);

  const liveItineraries = useMemo(() => {
    if (terms.length === 0) return cityScopedItins;
    return cityScopedItins.filter(it => {
      const fields = normalize([it.name, it.creatorName].join(" "));
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = normalize([exp.title, exp.location].join(" "));
        return terms.some(t => ef.includes(t) || (stem(t).length > 2 && ef.includes(stem(t))));
      });
      return terms.some(t => fields.includes(t) || (stem(t).length > 2 && fields.includes(stem(t)))) || expMatch;
    });
  }, [cityScopedItins, q]);

  const livePlaces = useMemo(() => {
    if (terms.length === 0) return cityScopedPois;
    return cityScopedPois
      .map((p: any) => ({ item: p, score: scoreMatch(terms, { title: p.name, location: p.destination_name, category: p.poi_type }) }))
      .filter((s: any) => s.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .map((s: any) => s.item);
  }, [cityScopedPois, q]);

  const showExperiences = typeFilter === null || typeFilter === "experiences";
  const showItineraries = typeFilter === null || typeFilter === "itineraries";
  const showPlaces = typeFilter === null || typeFilter === "places";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) addToRecentSearches(searchQuery);
    inputRef.current?.blur();
  };

  const handleQuickSearch = (query: string) => { onSearchChange(query); addToRecentSearches(query); };

  const clearRecentSearches = () => { setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); };

  const experiencePath = (experience: any) => generateProductPageUrl(experience.location || '', experience.title || '', experience.slug);
  const itineraryPath = (itinerary: any) => `/itineraries/${itinerary.slug || itinerary.id}`;
  const placePath = (poi: any) => `/things-to-do/${poi.destination_slug || 'explore'}/${poi.slug}`;

  const handleNavigate = (path: string) => {
    addToRecentSearches(searchQuery);
    if (!isDedicatedSearchRoute) onClose();
    navigate(path);
  };

  const toggleTypeFilter = (type: FilterType) => {
    setTypeFilter(prev => prev === type ? null : type);
  };

  if (!isOpen) return null;

  const noLocalResults = hasQuery && liveExperiences.length === 0 && liveItineraries.length === 0 && livePlaces.length === 0;

  const filters: { id: FilterType; label: string }[] = [
    { id: "experiences", label: "Experiences" },
    { id: "itineraries", label: "Itineraries" },
    { id: "places", label: "Places" },
  ];

  return (
    <div className="fixed inset-0 z-[55] bg-background animate-in fade-in duration-150" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Apple-style header: large search field, minimal */}
      <div className="shrink-0 bg-background">
        <div className="px-4 pt-[calc(env(safe-area-inset-top,8px)+12px)] pb-2.5">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0 flex items-center bg-muted rounded-xl px-3.5 py-2.5">
                <Search className="w-[18px] h-[18px] text-muted-foreground mr-2 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Search"
                  autoFocus
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[17px] text-foreground placeholder:text-muted-foreground/60 leading-tight"
                  style={{ fontSize: '17px', WebkitAppearance: 'none' }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => onSearchChange("")} className="p-0.5 rounded-full shrink-0 ml-1">
                    <div className="w-[18px] h-[18px] rounded-full bg-muted-foreground/40 flex items-center justify-center">
                      <X className="w-3 h-3 text-background" strokeWidth={3} />
                    </div>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="shrink-0 px-1 text-[15px] font-semibold text-primary active:opacity-60 transition-opacity"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setCitySheetOpen(true)}
                className={cn(
                  "shrink-0 flex items-center gap-1 px-1.5 py-1.5 rounded-full transition-all active:scale-95",
                  selectedCityData ? "bg-primary/10" : "bg-muted"
                )}
                aria-label="Filter by destination"
              >
                <span className="w-6 h-6 rounded-full overflow-hidden bg-background flex items-center justify-center shrink-0">
                  {selectedCityData?.flag_svg_url && isSvg(selectedCityData.flag_svg_url) ? (
                    <img src={selectedCityData.flag_svg_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MapIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </span>
                {selectedCityData && (
                  <span className="text-[12px] font-semibold leading-none text-primary max-w-[60px] truncate pr-0.5">
                    {selectedCityData.short_name || selectedCityData.name}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-muted-foreground mr-0.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Apple-style segmented filter row */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => toggleTypeFilter(id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all",
                typeFilter === id
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-px bg-border/40 mx-4" />
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        {hasQuery ? (
          <div className="px-4 pb-8">
            {/* Experiences first */}
            {showExperiences && liveExperiences.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Experiences</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveExperiences.map(exp => <SearchExperienceCard key={exp.id} experience={exp} onNavigate={() => handleNavigate(experiencePath(exp))} />)}
                </div>
              </div>
            )}

            {showItineraries && liveItineraries.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Itineraries</h2>
                <div className="grid grid-cols-2 gap-3">
                  {liveItineraries.map(it => <SearchItineraryCard key={it.id} itinerary={it} onNavigate={() => handleNavigate(itineraryPath(it))} />)}
                </div>
              </div>
            )}

            {showPlaces && livePlaces.length > 0 && (
              <div className="py-3">
                <h2 className="text-[15px] font-bold text-foreground mb-3">Places</h2>
                <div className="grid grid-cols-2 gap-3">
                  {livePlaces.map((p: any) => <SearchPlaceCard key={p.id} poi={p} onNavigate={() => handleNavigate(placePath(p))} />)}
                </div>
              </div>
            )}

            {noLocalResults && (
              <div className="text-center py-16 px-4">
                <Search className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[15px] text-muted-foreground">No results for "{searchQuery}"</p>
                <p className="text-[13px] text-muted-foreground/70 mt-1">Try a different keyword</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 pb-8">
            {recentSearches.length > 0 && (
              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Recent</h3>
                  <button onClick={clearRecentSearches} className="text-[13px] text-primary">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button key={index} onClick={() => handleQuickSearch(search)} className="px-3.5 py-1.5 rounded-full bg-muted text-[14px] text-foreground active:scale-95 transition-transform">{search}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {selectedCityData ? `Discover in ${selectedCityData.short_name || selectedCityData.name}` : "Discover"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {showExperiences && cityScopedExps.slice(0, 6).map(exp => (
                  <SearchExperienceCard key={exp.id} experience={exp} onNavigate={() => handleNavigate(experiencePath(exp))} />
                ))}
                {showPlaces && cityScopedPois.slice(0, 4).map((p: any) => (
                  <SearchPlaceCard key={p.id} poi={p} onNavigate={() => handleNavigate(placePath(p))} />
                ))}
                {showItineraries && cityScopedItins.slice(0, 4).map(it => (
                  <SearchItineraryCard key={it.id} itinerary={it} onNavigate={() => handleNavigate(itineraryPath(it))} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* City selector drawer */}
      <Drawer open={citySheetOpen} onOpenChange={setCitySheetOpen}>
        <DrawerContent className="max-h-[80vh] overflow-hidden !z-[70]">
          <div className="px-5 pt-2 pb-4 overflow-y-auto max-h-[75vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
            <h2 className="text-lg font-bold text-foreground mb-1">Select destination</h2>
            <p className="text-sm text-muted-foreground mb-5">Tap a city to filter, or tap again to clear</p>

            <div className="space-y-2 mb-6">
              {selectableCities.map((city: DbDestination) => {
                const isSelected = normalizeCity(selectedCity) === normalizeCity(city.name);
                const flag = city.flag_svg_url || '';
                return (
                  <button
                    key={city.id}
                    onClick={() => { handleCityChange(isSelected ? "" : city.name); setCitySheetOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98]",
                      isSelected ? "bg-primary/10 border border-primary/30" : "bg-card border border-border/60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {flag && isSvg(flag) ? <img src={flag} alt="" className="w-full h-full object-cover" /> : <MapIcon className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className={cn("font-semibold text-sm flex-1", isSelected ? "text-primary" : "text-foreground")}>{city.name}</p>
                  </button>
                );
              })}
            </div>

            {comingSoonCities.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coming soon</p>
                <div className="space-y-1.5">
                  {comingSoonCities.map((city: DbDestination) => (
                    <div key={city.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {city.flag_svg_url && isSvg(city.flag_svg_url) ? <img src={city.flag_svg_url} alt="" className="w-full h-full object-cover" /> : <MapIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <p className="text-sm font-medium text-foreground flex-1">{city.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
