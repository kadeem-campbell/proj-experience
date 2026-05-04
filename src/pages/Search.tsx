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
import { Compass, ChevronLeft, ChevronRight, Search as SearchIcon, X, MapPin, Map as MapIcon, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <div className="mb-10">
      <div className="mb-4">
        {onViewAll ? (
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-1 text-left cursor-pointer"
          >
            <h2 className="text-[18px] font-semibold text-foreground tracking-[-0.015em] leading-none">
              {title}
            </h2>
            <ChevronRight className="w-3.5 h-3.5 text-foreground/30 group-hover:translate-x-0.5 transition-transform relative top-[1px]" />
          </button>
        ) : (
          <h2 className="text-[18px] font-semibold text-foreground tracking-[-0.015em] leading-none">{title}</h2>
        )}
      </div>
      {/* Auto-fill experiences: 1fr fills available width so no empty gap on right; per-cell max-width prevents lone items from stretching across the row; grid-auto-rows:0 + overflow-hidden hard-clips any 2nd row so it's ALWAYS one row */}
      <div
        className={cn("grid overflow-hidden [grid-template-rows:auto] [grid-auto-rows:0]", gap)}
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}
      >
        {(Array.isArray(children) ? children : [children]).slice(0, 6).map((child, i) => (
          <div key={i} className="min-w-0 max-w-[260px]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── City picker modal body ────────────────────────────────────────
const CityPickerBody = ({
  destinations,
  selectedCity,
  onCitySelect,
}: {
  destinations: BrowseDestination[];
  selectedCity: BrowseDestination | null;
  onCitySelect: (city: BrowseDestination | null) => void;
}) => {
  const [query, setQuery] = useState("");
  const isLive = (d: BrowseDestination) => d.launch_status === "live";
  const formatLaunchMonth = (date?: string | null) => {
    if (!date) return "Coming soon";
    const dt = new Date(`${date}T00:00:00`);
    return `${dt.toLocaleDateString("en-US", { month: "long" })} ${dt.getFullYear()}`;
  };

  const trimmed = query.trim().toLowerCase();
  const live = useMemo(
    () => destinations.filter(isLive).filter((d) => d.name.toLowerCase().includes(trimmed)),
    [destinations, trimmed]
  );
  // Coming-soon: only surface them when the user actively searches and there's a name match
  const comingSoon = useMemo(
    () =>
      trimmed.length > 0
        ? destinations.filter((d) => !isLive(d) && d.name.toLowerCase().includes(trimmed))
        : [],
    [destinations, trimmed]
  );

  return (
    <div className="flex flex-col max-h-[440px]">
      {/* Compact section label + search (Spotify-style) */}
      <div className="px-2 pt-2 pb-1.5">
        <div className="px-2 pt-1 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Destination</div>
        <div className="relative flex items-center bg-muted rounded-lg px-3 h-9">
          <SearchIcon className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground/60"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-0.5 rounded-full shrink-0 ml-1">
              <X className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
        {live.length === 0 && comingSoon.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">No destinations found</div>
        ) : (
          <>
            {live.map((d) => {
              const active = selectedCity?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onCitySelect(active ? null : d)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px] font-semibold text-left transition-colors",
                    active ? "bg-foreground/5 text-foreground" : "hover:bg-foreground/5 text-foreground/80"
                  )}
                >
                  {d.flag_svg_url ? (
                    <img src={d.flag_svg_url} className="w-6 h-6 rounded-full object-cover ring-1 ring-border/60 shrink-0" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-1 ring-border/60 shrink-0">
                      <MapIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex-1 truncate">{d.name}</span>
                  {active && <Check className="w-4 h-4 text-foreground shrink-0" />}
                </button>
              );
            })}

            {comingSoon.length > 0 && (
              <>
                <div className="px-2 pt-3 pb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Coming soon</div>
                {comingSoon.map((d) => (
                  <div
                    key={d.id}
                    aria-disabled
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px] font-semibold text-left text-foreground/40 cursor-not-allowed select-none"
                  >
                    {d.flag_svg_url ? (
                      <img src={d.flag_svg_url} className="w-6 h-6 rounded-full object-cover ring-1 ring-border/60 shrink-0 grayscale opacity-70" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-1 ring-border/60 shrink-0">
                        <MapIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-[10.5px] font-semibold text-muted-foreground/70 shrink-0">
                      {formatLaunchMonth(d.launch_date)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Swam Hero: brand intro + integrated search trigger ───────────
const SwamHero = ({
  onOpenSearch,
  searchQuery,
  selectedCityName,
}: {
  onOpenSearch: (mode?: 'experiences' | 'itineraries') => void;
  searchQuery: string;
  selectedCityName: string;
}) => {
  return (
    <section className="relative -mx-5 lg:-mx-8 px-5 lg:px-8 pt-12 pb-6 mb-6 overflow-hidden border-b border-border/50">
      {/* Soft brand glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-20 right-10 w-[280px] h-[280px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="max-w-[820px] mx-auto text-center">
        <h1 className="text-[34px] md:text-[44px] leading-[1.05] font-extrabold tracking-[-0.035em] text-foreground whitespace-nowrap">
          Travel built for{" "}
          <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
            the next generation
          </span>
        </h1>
        <p className="mt-3 text-[15px] md:text-[16px] text-muted-foreground max-w-[560px] mx-auto leading-relaxed">
          Discover places, plan itineraries and find the right vibe — curated by humans, powered by intelligence.
        </p>

        {/* Big search trigger */}
        <button
          onClick={() => onOpenSearch()}
          className="group mt-5 mx-auto w-full max-w-[640px] flex items-center gap-3 h-[60px] pl-5 pr-2 rounded-full bg-background border border-border/70 shadow-[0_10px_40px_-12px_hsl(var(--foreground)/0.18)] hover:shadow-[0_14px_44px_-10px_hsl(var(--primary)/0.25)] hover:border-primary/40 transition-all"
        >
          <SearchIcon className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left text-[15px] font-medium text-foreground/70 truncate">
            {searchQuery
              ? searchQuery
              : selectedCityName
                ? `Explore ${selectedCityName} — places, vibes, seasons…`
                : "Where to? Try a city, vibe, or season"}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 h-9 px-3 mr-1 rounded-full bg-muted text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
            ⌘ K
          </span>
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
            <ArrowRightIcon />
          </span>
        </button>

      </div>
    </section>
  );
};

// Tiny inline arrow to avoid an extra import
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// ─── Big Swam Search Modal with all filters ───────────────────────
const SwamSearchModal = ({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  destinations,
  selectedCity,
  onCitySelect,
  vibes,
  onVibesChange,
  categories,
  activeCategoryId,
  onCategoryChange,
  mode,
  onModeChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  destinations: BrowseDestination[];
  selectedCity: BrowseDestination | null;
  onCitySelect: (c: BrowseDestination | null) => void;
  vibes: VibeFilters;
  onVibesChange: (v: VibeFilters) => void;
  categories: { id: string; name: string; iconUrl: string | null }[];
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  mode: 'things' | 'itineraries';
  onModeChange: (m: 'things' | 'itineraries') => void;
}) => {
  const liveDestinations = destinations.filter((d) => d.launch_status === "live");

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-muted-foreground mb-2.5">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 rounded-full text-[13px] font-semibold border transition-all flex items-center gap-1.5",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground/80 border-border hover:border-foreground/40"
      )}
    >
      {children}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[920px] w-[95vw] p-0 rounded-3xl overflow-hidden border border-border/70 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]">
        {/* Search header with mode toggle */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60 space-y-3">
          <div className="inline-flex items-center bg-muted/60 rounded-full p-1">
            {(['things', 'itineraries'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={cn(
                  "h-8 px-4 rounded-full text-[12.5px] font-bold transition-colors",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === 'things' ? 'Experiences' : 'Itineraries'}
              </button>
            ))}
          </div>
          <div className="relative flex items-center bg-muted/60 rounded-2xl px-5 h-14">
            <SearchIcon className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={mode === 'itineraries' ? "Search itineraries…" : "Search experiences, vibes, places…"}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[17px] text-foreground placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="p-1 rounded-full">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filter body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-6">
          <Section label="Country / City">
            <Pill active={!selectedCity} onClick={() => onCitySelect(null)}>All destinations</Pill>
            {liveDestinations.map((d) => (
              <Pill
                key={d.id}
                active={selectedCity?.id === d.id}
                onClick={() => onCitySelect(selectedCity?.id === d.id ? null : d)}
              >
                {d.flag_svg_url && <img src={d.flag_svg_url} alt="" className="w-4 h-4 rounded-full object-cover" />}
                {d.name}
              </Pill>
            ))}
          </Section>

          <Section label="Time of day">
            {TIME_OPTIONS.map((opt) => (
              <Pill key={opt} active={vibes.time === opt} onClick={() => onVibesChange({ ...vibes, time: vibes.time === opt ? null : opt })}>
                {opt}
              </Pill>
            ))}
          </Section>

          <Section label="Season">
            {SEASON_OPTIONS.map((opt) => (
              <Pill key={opt} active={vibes.season === opt} onClick={() => onVibesChange({ ...vibes, season: vibes.season === opt ? null : opt })}>
                {opt}
              </Pill>
            ))}
          </Section>

          <Section label="Vibe">
            {MOOD_OPTIONS.map((opt) => (
              <Pill key={opt} active={vibes.mood === opt} onClick={() => onVibesChange({ ...vibes, mood: vibes.mood === opt ? null : opt })}>
                {opt}
              </Pill>
            ))}
          </Section>

          {categories.length > 0 && (
            <Section label="Category">
              {categories.map((cat) => (
                <Pill
                  key={cat.id}
                  active={activeCategoryId === cat.id}
                  onClick={() => onCategoryChange(activeCategoryId === cat.id ? null : cat.id)}
                >
                  {cat.iconUrl && <img src={cat.iconUrl} alt="" className="w-4 h-4 rounded-md object-cover" />}
                  {cat.name}
                </Pill>
              ))}
            </Section>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between bg-muted/20">
          <button
            onClick={() => {
              onSearchChange("");
              onCitySelect(null);
              onVibesChange({ time: null, season: null, mood: null });
              onCategoryChange(null);
            }}
            className="text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
          <Button onClick={() => onOpenChange(false)} className="rounded-full h-11 px-7 font-bold">
            Show results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  return (
    <div className="sticky top-0 z-20 -mx-5 lg:-mx-8 px-5 lg:px-8 pt-5 pb-4 bg-background/85 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center gap-3 pr-28">
        {/* Search pill — matches reference screenshot */}
        <div className="relative flex-1 min-w-0 flex items-center bg-muted/60 ring-1 ring-border/50 rounded-full px-4 h-11 max-w-[560px]">
          <SearchIcon className="w-[18px] h-[18px] text-muted-foreground mr-2 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-foreground placeholder:text-muted-foreground/70 leading-tight"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="p-0.5 rounded-full shrink-0 ml-1">
              <div className="w-[18px] h-[18px] rounded-full bg-muted-foreground/40 flex items-center justify-center">
                <X className="w-3 h-3 text-background" strokeWidth={3} />
              </div>
            </button>
          )}
        </div>
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

const FilterPopover = ({
  label,
  value,
  onClear,
  align = "start",
  width = 280,
  children,
}: {
  label: string;
  value: string | null;
  onClear: () => void;
  align?: "start" | "end" | "center";
  width?: number;
  children: (close: () => void) => React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-9 px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-all",
            value
              ? "bg-foreground text-background shadow-sm"
              : "bg-muted/60 text-foreground hover:bg-muted"
          )}
        >
          {value || label}
          <ChevronDown className={cn("w-3.5 h-3.5", value ? "opacity-80" : "opacity-50")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        style={{ width }}
        className="p-0 rounded-2xl border border-border/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] bg-popover overflow-hidden"
      >
        <div className="px-2 pt-2 pb-1.5">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">{label}</span>
            {value && (
              <button
                onClick={() => { onClear(); close(); }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="px-2 pb-2 max-h-[360px] overflow-y-auto">
          {children(close)}
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
      {groups.map((g) => {
        const current = vibes[g.key];
        return (
          <FilterPopover
            key={g.key}
            label={g.label}
            value={current}
            onClear={() => onChange({ ...vibes, [g.key]: null })}
          >
            {(close) => (
              <div className="flex flex-col">
                {g.opts.map((opt) => {
                  const selected = current === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        onChange({ ...vibes, [g.key]: selected ? null : opt });
                        close();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px] font-semibold text-left transition-colors",
                        selected ? "bg-foreground/5 text-foreground" : "hover:bg-foreground/5 text-foreground/80"
                      )}
                    >
                      <span className="flex-1 truncate">{opt}</span>
                      {selected && <Check className="w-4 h-4 text-foreground shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </FilterPopover>
        );
      })}

      {/* Categories pill — same dropdown style */}
      {categories.length > 0 && onCategoryChange && (
        <FilterPopover
          label="Category"
          value={activeCat?.name ?? null}
          onClear={() => onCategoryChange(null)}
          width={300}
        >
          {(close) => (
            <div className="flex flex-col">
              {categories.map((cat) => {
                const selected = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onCategoryChange(selected ? null : cat.id); close(); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px] font-semibold text-left transition-colors",
                      selected ? "bg-foreground/5 text-foreground" : "hover:bg-foreground/5 text-foreground/80"
                    )}
                  >
                    {cat.iconUrl ? (
                      <img src={cat.iconUrl} alt="" className="w-6 h-6 rounded-md object-cover ring-1 ring-border/60 shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-muted ring-1 ring-border/60 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{cat.name}</span>
                    {selected && <Check className="w-4 h-4 text-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </FilterPopover>
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
  max = 8,
}: {
  pois: any[];
  destinationSlug?: string;
  max?: number;
}) => {
  const navigate = useNavigate();
  if (!pois || pois.length === 0) return null;
  const items = pois.slice(0, Math.min(max, 8));
  return (
    <div className="-mx-5 lg:-mx-8 px-5 lg:px-8 pt-6 pb-7 border-b border-border/50">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-[20px] font-extrabold text-foreground tracking-[-0.02em]">Places</h3>
      </div>
      {/* Auto-fill places: 1fr fills available width; grid-auto-rows:0 hard-clips any 2nd row */}
      <div
        className="grid overflow-hidden [grid-template-rows:auto] [grid-auto-rows:0] gap-4 lg:gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
      >
        {items.map((poi) => (
          <button
            key={poi.id}
            onClick={() => navigate(`/things-to-do/${destinationSlug || 'explore'}/${poi.slug}`)}
            className="min-w-0 max-w-[160px] flex flex-col items-start gap-3 group"
          >
            <div className="relative w-full aspect-square rounded-full overflow-hidden bg-muted ring-1 ring-border/40 group-hover:ring-2 group-hover:ring-foreground/80 transition-all duration-300">
              {poi.cover_image ? (
                <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="w-full text-left px-1">
              <p className="text-[14px] font-extrabold text-foreground tracking-tight line-clamp-1">{poi.name}</p>
              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 capitalize">{poi.poi_type || 'Place'}</p>
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // ⌘K / Ctrl+K to open search modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        <SwamHero
          onOpenSearch={(m) => {
            if (m) setMode(m === 'experiences' ? 'things' : 'itineraries');
            setSearchModalOpen(true);
          }}
          searchQuery={searchQuery}
          selectedCityName={selectedCityName}
        />

        <SwamSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          destinations={allDestinations}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          vibes={vibes}
          onVibesChange={setVibes}
          categories={homeCategories}
          activeCategoryId={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
          mode={mode}
          onModeChange={setMode}
        />

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

                // First two carousels render above the "Best places" / top lists section
                const topCarousels = resolvedCarousels.slice(0, 2);
                const rest = resolvedCarousels.slice(2);

                const renderCarousel = (c: typeof resolvedCarousels[number], featured = false) => (
                  <DesktopGridRow key={c.carousel.id} title={c.title} onViewAll={c.onTitleClick}>
                    {(featured ? c.items.slice(0, 8) : c.items).map((it: any) => {
                      if (it.type === 'product') {
                        return featured ? (
                          <button
                            key={`prod-${it.data.id}`}
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
                            <h3 className="mt-1.5 text-[15px] font-bold text-foreground line-clamp-1">{it.data.title}</h3>
                            <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{it.data.location}</p>
                          </button>
                        ) : (
                          <ProductCard key={`prod-${it.data.id}`} {...it.data} compact square />
                        );
                      }
                      if (it.type === 'itinerary') {
                        return <PublicItineraryCard key={`itin-${it.data.id}`} itinerary={it.data} />;
                      }
                      return <DesktopPoiCard key={`poi-${it.data.id}`} poi={it.data} destinationSlug={destSlug} />;
                    })}
                  </DesktopGridRow>
                );

                return (
                  <>
                    {/* First two carousels (above the places row) */}
                    {topCarousels.map((c, i) => renderCarousel(c, i === 0))}

                    {/* Spotify-style POI circles row */}
                    <DesktopPoiCirclesRow
                      pois={selectedDestId ? pois.filter((p: any) => p.destination_id === selectedDestId) : pois}
                      destinationSlug={destSlug}
                    />

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
                    {rest.map((c) => renderCarousel(c))}

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
