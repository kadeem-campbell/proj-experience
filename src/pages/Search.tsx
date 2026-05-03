import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead, createWebsiteJsonLd } from "@/components/SEOHead";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ProductCard } from "@/components/ProductCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { MobileHomeView } from "@/components/MobileHomeView";
import { MobileShell } from "@/components/MobileShell";
import { useItineraries } from "@/hooks/useItineraries";
import { usePopularItineraries } from "@/hooks/usePublicItineraries";

import { Input } from "@/components/ui/input";
import { BrowseDestination } from "@/hooks/useDestinations";
import { useDestinations } from "@/hooks/useDestinations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProductListings } from "@/hooks/useProductListings";
import { useHomeCarousels, useHomeCategories, matchesContext, resolveCarouselItems, type ResolvedItem } from "@/hooks/useHomeCarousels";
import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/utils/slugUtils";
import { Compass, ChevronLeft, ChevronRight, Search as SearchIcon, X, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  Beaches: catBeaches,
  Nightlife: catNightlife,
  Nature: catNature,
  Adventure: catAdventure,
  Food: catFood,
  Safari: catSafari,
};

// ─── Spotify-style Desktop Single-Row (clipped, no horizontal drag) ────
const DesktopGridRow = ({
  title,
  onViewAll,
  children,
  // Cap at 5 per row on desktop/tablet
  itemBasis = "basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/5",
  gap = "gap-4",
}: {
  title: string;
  onViewAll?: () => void;
  children: React.ReactNode;
  itemBasis?: string;
  gap?: string;
}) => {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-end justify-between">
        {onViewAll ? (
          <button
            onClick={onViewAll}
            className="text-[22px] font-extrabold text-foreground tracking-tight hover:opacity-70 transition-opacity text-left cursor-pointer"
          >
            {title}
          </button>
        ) : (
          <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">{title}</h2>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[12px] font-bold text-muted-foreground hover:text-foreground tracking-wide uppercase"
          >
            Show all
          </button>
        )}
      </div>
      {/* 4 cards per row, single row only — extras hidden */}
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid-rows-1 overflow-hidden", gap)}>
        {(Array.isArray(children) ? children : [children]).slice(0, 4).map((child, i) => (
          <div key={i} className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Top bar: mode toggle + search + city dropdown ─────────────────
const DesktopTopBar = ({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  destinations,
}: {
  mode: 'things' | 'itineraries';
  onModeChange: (m: 'things' | 'itineraries') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCity: BrowseDestination | null;
  onCitySelect: (city: BrowseDestination | null) => void;
  destinations: BrowseDestination[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-20 -mx-5 lg:-mx-8 px-5 lg:px-8 pt-4 pb-3 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* iOS-style segmented toggle (sliding knob) */}
        <div className="relative inline-flex items-center bg-muted rounded-full p-1 shrink-0 h-11 w-[260px]">
          <span
            aria-hidden
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-background shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              mode === 'things' ? "translate-x-0" : "translate-x-[calc(100%+4px)]"
            )}
            style={{ left: 4 }}
          />
          <button
            onClick={() => onModeChange('things')}
            className={cn(
              "relative z-10 flex-1 h-9 rounded-full text-[13px] font-bold transition-colors",
              mode === 'things' ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Things to do
          </button>
          <button
            onClick={() => onModeChange('itineraries')}
            className={cn(
              "relative z-10 flex-1 h-9 rounded-full text-[13px] font-bold transition-colors",
              mode === 'itineraries' ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Itineraries
          </button>
        </div>

        {/* Search (flex grow) */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search things to do, itineraries, places…"
            className="pl-10 pr-10 h-11 rounded-full bg-muted border-0 text-sm focus-visible:ring-1 focus-visible:ring-border"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* City dropdown (right) */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="shrink-0 flex items-center gap-2.5 h-11 px-5 rounded-full bg-muted hover:bg-muted/80 text-[14px] font-bold text-foreground">
              {selectedCity ? (
                <>
                  {selectedCity.flag_svg_url && (
                    <img src={selectedCity.flag_svg_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                  )}
                  <span className="max-w-[160px] truncate">{selectedCity.name}</span>
                </>
              ) : (
                <MapPin className="w-5 h-5" />
              )}
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1.5">
            
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => { onCitySelect(selectedCity?.id === d.id ? null : d); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-semibold text-left",
                  selectedCity?.id === d.id ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                {d.flag_svg_url && <img src={d.flag_svg_url} className="w-4 h-4 rounded-full object-cover" alt="" />}
                {d.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// ─── Desktop category icon row (uses same images as mobile) ────────
const DesktopCategoryRow = ({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: { id: string; name: string; iconUrl: string | null }[];
  activeCategoryId: string | null;
  onSelect: (id: string | null) => void;
}) => {
  if (categories.length === 0) return null;
  return (
    <div className="-mx-5 lg:-mx-8 px-5 lg:px-8 py-4 border-b border-border/50">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          const icon = cat.iconUrl || DEFAULT_CATEGORY_ICONS[cat.name] || catNature;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? null : cat.id)}
              className={cn(
                "shrink-0 flex flex-col items-center gap-1.5 px-4 py-2 transition-all min-w-[88px] relative",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full overflow-hidden flex items-center justify-center transition-all",
                isActive ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "bg-muted"
              )}>
                <img src={icon} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[12px] font-semibold tracking-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Ctrip-style city quick-pick pills (compact, primary-tinted) ──
const CityQuickPicks = ({
  destinations,
  selectedCity,
  onSelect,
  max = 6,
}: {
  destinations: BrowseDestination[];
  selectedCity: BrowseDestination | null;
  onSelect: (c: BrowseDestination | null) => void;
  max?: number;
}) => {
  if (destinations.length === 0) return null;
  const top = destinations.slice(0, max);
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-[13px] font-bold text-foreground mr-1">Popular</span>
      {top.map((d) => {
        const isActive = selectedCity?.id === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(isActive ? null : d)}
            className={cn(
              "h-8 px-3.5 rounded-full text-[12.5px] font-bold transition-colors flex items-center gap-1.5 border",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground/80 border-border hover:border-primary/60 hover:text-primary"
            )}
          >
            {d.flag_svg_url && <img src={d.flag_svg_url} alt="" className="w-4 h-4 rounded-full object-cover" />}
            {d.name}
          </button>
        );
      })}
    </div>
  );
};

// ─── Vibe filters: time of day, season, mood ─────────────────────
type VibeFilters = { time: string | null; season: string | null; mood: string | null };
const TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Late night"];
const SEASON_OPTIONS = ["Dry season", "Green season", "Festivals", "Migration"];
const MOOD_OPTIONS = ["Romantic", "Family", "Adrenaline", "Slow & chilled", "Foodie", "Off the beaten path"];

const VibeFilterRow = ({
  vibes,
  onChange,
  categories = [],
  activeCategoryId = null,
  onCategoryChange,
}: {
  vibes: VibeFilters;
  onChange: (v: VibeFilters) => void;
  categories?: { id: string; name: string; iconUrl: string | null }[];
  activeCategoryId?: string | null;
  onCategoryChange?: (id: string | null) => void;
}) => {
  const groups: Array<{ key: keyof VibeFilters; label: string; opts: string[] }> = [
    { key: 'time', label: 'Time', opts: TIME_OPTIONS },
    { key: 'season', label: 'Season', opts: SEASON_OPTIONS },
    { key: 'mood', label: 'Vibe', opts: MOOD_OPTIONS },
  ];
  const activeCat = categories.find(c => c.id === activeCategoryId) || null;
  const hasAny = !!(vibes.time || vibes.season || vibes.mood || activeCategoryId);
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      {groups.map((g) => (
        <Popover key={g.key}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "h-8 px-3.5 rounded-full text-[12.5px] font-bold border flex items-center gap-1.5 transition-colors",
                vibes[g.key]
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-background text-foreground/80 border-border hover:border-primary/60"
              )}
            >
              {vibes[g.key] || g.label}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1.5">
            {g.opts.map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ ...vibes, [g.key]: vibes[g.key] === opt ? null : opt })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-[13px] font-semibold",
                  vibes[g.key] === opt ? "bg-muted text-foreground" : "hover:bg-muted/60 text-foreground/80"
                )}
              >
                {opt}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ))}

      {/* Categories pill — same style as Time/Season/Vibe */}
      {categories.length > 0 && onCategoryChange && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "h-8 px-3.5 rounded-full text-[12.5px] font-bold border flex items-center gap-1.5 transition-colors",
                activeCat
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-background text-foreground/80 border-border hover:border-primary/60"
              )}
            >
              {activeCat?.name || 'Category'}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1.5 max-h-[320px] overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(activeCategoryId === cat.id ? null : cat.id)}
                className={cn(
                  "w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-md text-[13px] font-semibold",
                  activeCategoryId === cat.id ? "bg-muted text-foreground" : "hover:bg-muted/60 text-foreground/80"
                )}
              >
                {cat.iconUrl && (
                  <img src={cat.iconUrl} alt="" className="w-5 h-5 rounded-md object-cover" />
                )}
                {cat.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {hasAny && (
        <button
          onClick={() => {
            onChange({ time: null, season: null, mood: null });
            onCategoryChange?.(null);
          }}
          className="h-8 px-2.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
};

// ─── Ranked Top-2 list (Ctrip-style two-column ranked table) ─────
const RankedTopList = ({
  title,
  badgeLabel,
  items,
  destinationSlug,
  onTitleClick,
}: {
  title: string;
  badgeLabel?: string;
  items: any[];
  destinationSlug?: string;
  onTitleClick?: () => void;
}) => {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <button
          onClick={onTitleClick}
          className={cn("flex items-center gap-2 text-[15px] font-extrabold text-foreground tracking-tight", onTitleClick && "hover:text-primary")}
        >
          {title}
          {onTitleClick && <ChevronRight className="w-4 h-4" />}
        </button>
        {badgeLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{badgeLabel}</span>
        )}
      </div>
      <div className="divide-y divide-border">
        {items.slice(0, 5).map((it, idx) => (
          <button
            key={it.id}
            onClick={() => {
              if (it.poi_type !== undefined) navigate(`/things-to-do/${destinationSlug || 'explore'}/${it.slug}`);
              else navigate(`/things-to-do/${destinationSlug || slugify(it.location || 'explore')}/${it.slug || it.id}`);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
          >
            <span className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-extrabold shrink-0",
              idx === 0 ? "bg-primary text-primary-foreground" :
              idx === 1 ? "bg-primary/70 text-primary-foreground" :
              idx === 2 ? "bg-primary/50 text-primary-foreground" :
                          "bg-muted text-muted-foreground"
            )}>{idx + 1}</span>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
              {(it.cover_image || it.image || it.videoThumbnail) && (
                <img src={it.cover_image || it.image || it.videoThumbnail} alt={it.name || it.title} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-foreground line-clamp-1">{it.name || it.title}</p>
              <p className="text-[11.5px] text-muted-foreground line-clamp-1 mt-0.5">{it.poi_type || it.location || it.category}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Spotify-style POI circles row ─────────────────────────────
const DesktopPoiCirclesRow = ({
  pois,
  destinationSlug,
  max = 10,
}: {
  pois: any[];
  destinationSlug?: string;
  max?: number;
}) => {
  const navigate = useNavigate();
  if (!pois || pois.length === 0) return null;
  const items = pois.slice(0, max);
  return (
    <div className="-mx-5 lg:-mx-8 px-5 lg:px-8 pt-5 pb-6 border-b border-border/50">
      <h3 className="text-[18px] font-extrabold text-foreground tracking-tight mb-4">Places</h3>
      <div className="flex items-start gap-5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {items.map((poi) => (
          <button
            key={poi.id}
            onClick={() => navigate(`/things-to-do/${destinationSlug || 'explore'}/${poi.slug}`)}
            className="shrink-0 w-[128px] flex flex-col items-start gap-2.5 group"
          >
            <div className="w-[128px] h-[128px] rounded-full overflow-hidden bg-muted shadow-md group-hover:shadow-lg transition-shadow">
              {poi.cover_image ? (
                <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/40" />
              )}
            </div>
            <div className="w-full text-left px-0.5">
              <p className="text-[14px] font-bold text-foreground line-clamp-1">{poi.name}</p>
              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{poi.poi_type || 'Place'}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


// ─── POI Card for desktop ────────────────────────────────────────
const DesktopPoiCard = ({ poi, destinationSlug }: { poi: any; destinationSlug?: string }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="cursor-pointer group"
      onClick={() => navigate(`/things-to-do/${destinationSlug || 'explore'}/${poi.slug}`)}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        {poi.cover_image ? (
          <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-bold line-clamp-2 leading-tight">{poi.name}</p>
          <p className="text-white/60 text-xs font-medium mt-0.5 capitalize">{poi.poi_type}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Synonym map for search ──────────────────────────────────────
const synonyms: Record<string, string[]> = {
  Party: ["party","nightlife","club","rave","dance","bar","drinks","lounge","cocktail"],
  "Water Sports": ["water sports","jet ski","kayak","surf","snorkel","dive","boat","sail","paddle"],
  Beach: ["beach","sun","sand","ocean","coast","tropical","island","seaside"],
  Food: ["food","eat","dine","restaurant","cuisine","street food","tasting","chef","culinary"],
  Wildlife: ["wildlife","safari","animal","nature","reserve","park","bird","jungle"],
  Adventure: ["adventure","hike","trek","zipline","climb","mountain","explore","extreme"],
  Culture: ["culture","museum","art","heritage","history","temple","monument","festival"],
  Wellness: ["wellness","spa","massage","yoga","meditation","retreat","relax"],
};

const SCROLL_STORAGE_KEY = "discover_scroll_position";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<BrowseDestination | null>(null);
  const { data: allDestinations = [] } = useDestinations();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const experiences = useProductListings();
  const { data: popularItinerariesForSearch = [] } = usePopularItineraries();
  const { data: allItinerariesData = [] } = usePublicItineraries();
  const { data: homeCarousels = [] } = useHomeCarousels();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { activeItinerary, experienceCount } = useItineraries();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<'things' | 'itineraries'>('things');
  const { data: homeCategories = [] } = useHomeCategories();
  const [vibes, setVibes] = useState<VibeFilters>({ time: null, season: null, mood: null });

  // Fetch POIs
  const { data: pois = [] } = useQuery({
    queryKey: ["desktop-pois"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pois")
        .select("id, name, slug, poi_type, cover_image, destination_id")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Sync city from URL
  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam && allDestinations.length > 0) {
      const found = allDestinations.find(d => d.name.toLowerCase() === cityParam.toLowerCase() || d.slug === cityParam.toLowerCase());
      if (found) setSelectedCity(found);
    } else if (!cityParam) {
      setSelectedCity(null);
    }
  }, [searchParams, allDestinations]);

  const handleCitySelect = (city: BrowseDestination | null) => {
    setSelectedCity(city);
    setSelectedCategory(null);
    // Sync to URL so the state is consistent
    const params = new URLSearchParams(window.location.search);
    if (city) params.set("city", city.name);
    else params.delete("city");
    const newSearch = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
  };

  const selectedDestId = selectedCity?.id || null;
  const selectedCityName = selectedCity?.name || '';
  const destSlug = selectedCityName ? slugify(selectedCityName) : '';

  // Filter experiences/products by city (use destinationId for products, location string for legacy)
  const cityFilteredExperiences = useMemo(() => {
    if (!selectedCity) return experiences;
    return experiences.filter(e => 
      e.destinationId === selectedCity.id || 
      e.location?.toLowerCase().includes(selectedCity.name.toLowerCase())
    );
  }, [experiences, selectedCity]);

  // Filter itineraries by city
  const cityFilteredItineraries = useMemo(() => {
    if (!selectedCity) return allItinerariesData;
    const cityName = selectedCity.name.toLowerCase();
    return allItinerariesData.filter(it => {
      return it.name.toLowerCase().includes(cityName) || 
        it.experiences?.some((e: any) => e.location?.toLowerCase().includes(cityName));
    });
  }, [allItinerariesData, selectedCity]);

  // Search filter
  const normalizeText = (text: string) => text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return cityFilteredExperiences.filter(e => {
      const fields = [e.title, e.location, e.category, e.creator].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => fields.includes(term));
    });
  }, [searchQuery, cityFilteredExperiences]);

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return cityFilteredItineraries.filter(it => {
      const fields = [it.name, it.creatorName].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => fields.includes(term));
    });
  }, [searchQuery, cityFilteredItineraries]);

  // Build carousel rows from homeCarousels (use unified context filter, same as mobile)
  const carouselRows = useMemo(() => {
    return homeCarousels.filter((c) => matchesContext(c, selectedDestId, activeCategoryId));
  }, [homeCarousels, selectedDestId, activeCategoryId]);

  // Lookup maps for the unified resolver (mirrors MobileHomeView)
  const productDestMap = useMemo(() => {
    const m = new Map<string, string | null>();
    experiences.forEach(p => m.set(p.id, p.destinationId || null));
    return m;
  }, [experiences]);
  const productCatMap = useMemo(() => {
    const m = new Map<string, string | null>();
    experiences.forEach(p => m.set(p.id, (p as any).activityTypeId || null));
    return m;
  }, [experiences]);
  const itinDestMap = useMemo(() => {
    const m = new Map<string, string | null>();
    allItinerariesData.forEach((it: any) => m.set(it.dbId || it.id, it.destinationId || null));
    return m;
  }, [allItinerariesData]);
  const poiDestMap = useMemo(() => {
    const m = new Map<string, string | null>();
    pois.forEach((p: any) => m.set(p.id, p.destination_id || null));
    return m;
  }, [pois]);
  const allProductIds = useMemo(() => experiences.map(p => p.id), [experiences]);

  const referencedCollectionIds = useMemo(() => {
    const ids = new Set<string>();
    homeCarousels.forEach(c => c.collectionIds.forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [homeCarousels]);

  const { data: collectionContentsRaw } = useQuery({
    queryKey: ["desktop-collection-items", referencedCollectionIds.sort().join(",")],
    enabled: referencedCollectionIds.length > 0,
    queryFn: async () => {
      const [itemsRes, destsRes, catsRes, slugRes] = await Promise.all([
        (supabase as any).from("collection_items").select("collection_id, item_id, item_type, position").in("collection_id", referencedCollectionIds).order("position"),
        (supabase as any).from("collection_destinations").select("collection_id, destination_id").in("collection_id", referencedCollectionIds),
        (supabase as any).from("collection_categories").select("collection_id, activity_type_id").in("collection_id", referencedCollectionIds),
        (supabase as any).from("collections").select("id, slug").in("id", referencedCollectionIds),
      ]);
      return { items: itemsRes.data || [], destinations: destsRes.data || [], categories: catsRes.data || [], slugs: slugRes.data || [] };
    },
    staleTime: 30 * 1000,
  });

  const collectionContents = useMemo(() => {
    const m = new Map<string, ResolvedItem[]>();
    ((collectionContentsRaw as any)?.items || []).forEach((r: any) => {
      const t = r.item_type === "experience" ? "product" : r.item_type;
      if (!["product","itinerary","poi","area"].includes(t)) return;
      const arr = m.get(r.collection_id) || [];
      arr.push({ type: t, id: r.item_id });
      m.set(r.collection_id, arr);
    });
    return m;
  }, [collectionContentsRaw]);
  const collectionDestMap = useMemo(() => {
    const m = new Map<string, string[]>();
    ((collectionContentsRaw as any)?.destinations || []).forEach((r: any) => {
      const arr = m.get(r.collection_id) || []; arr.push(r.destination_id); m.set(r.collection_id, arr);
    });
    return m;
  }, [collectionContentsRaw]);
  const collectionCatMap = useMemo(() => {
    const m = new Map<string, string[]>();
    ((collectionContentsRaw as any)?.categories || []).forEach((r: any) => {
      const arr = m.get(r.collection_id) || []; arr.push(r.activity_type_id); m.set(r.collection_id, arr);
    });
    return m;
  }, [collectionContentsRaw]);
  const collectionSlugMap = useMemo(() => {
    const m = new Map<string, string>();
    ((collectionContentsRaw as any)?.slugs || []).forEach((r: any) => { if (r.slug) m.set(r.id, r.slug); });
    return m;
  }, [collectionContentsRaw]);

  const hasSearchResults = searchQuery.trim().length > 0;

  // On mobile: "/" shows homepage, "/search" shows search overlay
  const isSearchRoute = window.location.pathname === '/search' || window.location.pathname === '/discover';
  
  useEffect(() => {
    if (isMobile && isSearchRoute) {
      setSearchQuery(searchParams.get('q') || '');
    }
  }, [isSearchRoute, isMobile, searchParams]);

  // Remember search referrer so detail pages can return here
  useEffect(() => {
    if (isSearchRoute) {
      sessionStorage.setItem('lastSearchUrl', window.location.pathname + window.location.search);
    }
  }, [isSearchRoute, searchParams]);

  if (isMobile && isSearchRoute) return (
    <MobileShell hideTopBar className="bg-background">
      <MobileSearchOverlay
        isOpen={true}
        onClose={() => navigate(-1)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => setSearchQuery(q)}
      />
    </MobileShell>
  );

  if (isMobile) return (
    <>
      <SEOHead
        title="Discover Experiences & Things to Do in East Africa"
        description="Explore curated experiences, activities and things to do in Zanzibar, Kilimanjaro, Nairobi and across East Africa."
        canonicalPath="/"
        indexability="public_indexed"
        jsonLd={createWebsiteJsonLd()}
      />
      <MobileHomeView />
    </>
  );

  return (
    <MainLayout searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCity={selectedCity} onCitySelect={handleCitySelect}>
      <SEOHead
        title="Discover Experiences & Things to Do"
        description="Explore curated experiences, activities and things to do."
        canonicalPath="/"
        indexability="public_indexed"
        jsonLd={createWebsiteJsonLd()}
      />

      <div className="px-5 lg:px-8 py-0 max-w-[1400px] mx-auto">
        <DesktopTopBar
          mode={mode}
          onModeChange={setMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          destinations={allDestinations}
        />

        {/* Spotify-style POI circles row (replaces icon category row) */}
        <DesktopPoiCirclesRow
          pois={selectedDestId ? pois.filter((p: any) => p.destination_id === selectedDestId) : pois}
          destinationSlug={destSlug}
        />

        {/* Customisable vibe filters (now includes Categories) */}
        <div className="pt-6 pb-2">
          <VibeFilterRow
            vibes={vibes}
            onChange={setVibes}
            categories={homeCategories}
            activeCategoryId={activeCategoryId}
            onCategoryChange={setActiveCategoryId}
          />
        </div>

        <div className="pb-12 pt-4">
          {hasSearchResults ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Results for "{searchQuery}"</h2>
                <button onClick={() => setSearchQuery("")} className="text-sm font-medium text-primary">Clear</button>
              </div>

              {filteredItineraries.length > 0 && (
                <DesktopGridRow title="Itineraries">
                  {filteredItineraries.slice(0, 8).map((it) => (
                    <PublicItineraryCard key={it.id} itinerary={it} />
                  ))}
                </DesktopGridRow>
              )}

              {filteredExperiences.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Things to do</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
                    {filteredExperiences.slice(0, 20).map((exp) => (
                      <ProductCard key={exp.id} {...exp} compact />
                    ))}
                  </div>
                </div>
              )}

              {filteredExperiences.length === 0 && filteredItineraries.length === 0 && (
                <div className="text-center py-20">
                  <SearchIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No results found</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {(() => {
                const productById = new Map(experiences.map(p => [p.id, p]));
                const itinByDbId  = new Map(allItinerariesData.map((it: any) => [it.dbId || it.id, it]));
                const poiById     = new Map(pois.map((p: any) => [p.id, p]));

                // Resolve all carousels with their items
                const resolvedCarousels = carouselRows.map((carousel) => {
                  const title = carousel.name.replace(/\{city\}/g, selectedCityName || 'Explore');
                  const linkedCollectionSlug = (carousel.resolutionMode === 'collection' && carousel.collectionIds.length === 1)
                    ? collectionSlugMap.get(carousel.collectionIds[0])
                    : undefined;
                  const targetSlug = linkedCollectionSlug || carousel.slug;
                  const onTitleClick = targetSlug ? () => navigate(`/collections/${targetSlug}`) : undefined;

                  const resolved = resolveCarouselItems(carousel, {
                    selectedDestId, activeCategoryId,
                    productDestMap, productCatMap, itinDestMap, poiDestMap,
                    collectionContents, collectionDestMap, collectionCatMap, allProductIds,
                  });

                  let items = resolved
                    .map(r => {
                      if (r.type === 'product')   return { type: r.type, data: productById.get(r.id) };
                      if (r.type === 'itinerary') return { type: r.type, data: itinByDbId.get(r.id) };
                      if (r.type === 'poi')       return { type: r.type, data: poiById.get(r.id) };
                      return null;
                    })
                    .filter((x: any): x is { type: string; data: any } => !!x && !!x.data);

                  // Apply mode filter (Things to do vs Itineraries)
                  if (mode === 'itineraries') items = items.filter(i => i.type === 'itinerary');
                  else items = items.filter(i => i.type !== 'itinerary');

                  return { carousel, title, onTitleClick, items };
                }).filter(c => c.items.length > 0);

                if (resolvedCarousels.length === 0) {
                  return (
                    <div className="text-center py-20">
                      <Compass className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nothing here yet for this filter.</p>
                    </div>
                  );
                }

                // Featured = first carousel rendered as large hero cards
                const [featured, ...rest] = resolvedCarousels;

                return (
                  <>
                    {/* Featured hero — larger cards in fewer columns */}
                    <DesktopGridRow
                      title={featured.title}
                      onViewAll={featured.onTitleClick}
                    >
                      {featured.items.slice(0, 8).map((it: any) => (
                        <div key={`${it.type}-${it.data.id}`}>
                          {it.type === 'product' && (
                            <button
                              onClick={() => navigate(`/things-to-do/${destSlug || slugify(it.data.location || 'explore')}/${it.data.slug || it.data.id}`)}
                              className="w-full text-left group"
                            >
                              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                                {it.data.image ? (
                                  <img src={it.data.image} alt={it.data.title} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/40" />
                                )}
                              </div>
                              <h3 className="mt-3 text-[15px] font-bold text-foreground line-clamp-1">{it.data.title}</h3>
                              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{it.data.location}</p>
                            </button>
                          )}
                          {it.type === 'itinerary' && (
                            <PublicItineraryCard itinerary={it.data} />
                          )}
                          {it.type === 'poi' && (
                            <DesktopPoiCard poi={it.data} destinationSlug={destSlug} />
                          )}
                        </div>
                      ))}
                    </DesktopGridRow>

                    {/* Ctrip-style ranked Top Lists — 2 columns */}
                    {(() => {
                      const cityPois = selectedDestId
                        ? pois.filter((p: any) => p.destination_id === selectedDestId)
                        : pois;
                      const topPlaces = cityPois.slice(0, 5);
                      const topProducts = (selectedDestId
                        ? experiences.filter(e => e.destinationId === selectedDestId)
                        : experiences
                      ).slice(0, 5);
                      if (topPlaces.length === 0 && topProducts.length === 0) return null;
                      const placeTitle = selectedCityName
                        ? `Best places in ${selectedCityName}`
                        : 'Best places to explore';
                      const productTitle = selectedCityName
                        ? `Top things to do in ${selectedCityName}`
                        : 'Top things to do by travellers';
                      return (
                        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {topPlaces.length > 0 && (
                            <RankedTopList
                              title={placeTitle}
                              badgeLabel="Editor's pick"
                              items={topPlaces}
                              destinationSlug={destSlug}
                              onTitleClick={destSlug ? () => navigate(`/${destSlug}`) : undefined}
                            />
                          )}
                          {topProducts.length > 0 && (
                            <RankedTopList
                              title={productTitle}
                              badgeLabel="Top rated"
                              items={topProducts}
                              destinationSlug={destSlug}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {/* Remaining carousels */}
                    {rest.map((c) => (
                      <DesktopGridRow key={c.carousel.id} title={c.title} onViewAll={c.onTitleClick}>
                        {c.items.map((it: any) => {
                          if (it.type === 'product') {
                            return <ProductCard key={`prod-${it.data.id}`} {...it.data} compact square />;
                          }
                          if (it.type === 'itinerary') {
                            return <PublicItineraryCard key={`itin-${it.data.id}`} itinerary={it.data} />;
                          }
                          return <DesktopPoiCard key={`poi-${it.data.id}`} poi={it.data} destinationSlug={destSlug} />;
                        })}
                      </DesktopGridRow>
                    ))}

                    {/* POI row at the bottom, optimised for desktop */}
                    {pois.length > 0 && (
                      <DesktopGridRow
                        title={selectedCityName ? `Places to explore in ${selectedCityName}` : 'Places to explore'}
                        onViewAll={destSlug ? () => navigate(`/${destSlug}`) : undefined}
                      >
                        {(selectedDestId ? pois.filter((p: any) => p.destination_id === selectedDestId) : pois)
                          .slice(0, 14)
                          .map((poi: any) => (
                            <DesktopPoiCard key={poi.id} poi={poi} destinationSlug={destSlug} />
                          ))}
                      </DesktopGridRow>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
