import { useState, useCallback, useEffect, ReactNode, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Home, Search, ListMusic, User, Map } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useItineraryUpdates } from "@/hooks/useItineraryUpdates";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCities, type DbCity } from "@/hooks/useAppData";

// Persist city globally via localStorage
const getPersistedCity = (): string => {
  try { return localStorage.getItem("swam_selected_city") || ""; } catch { return ""; }
};
const persistCity = (city: string) => {
  try { if (city) localStorage.setItem("swam_selected_city", city); else localStorage.removeItem("swam_selected_city"); } catch {}
};

const normalize = (value: string) => value.trim().toLowerCase();
const isLaunched = (city: DbCity) => {
  if (!city.launch_date) return true;
  return new Date(`${city.launch_date}T00:00:00`).getTime() <= Date.now();
};
const formatLaunchMonth = (launchDate?: string | null) => {
  if (!launchDate) return "Coming soon";
  return new Date(`${launchDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
const isSvg = (value?: string | null) => !!value && (value.includes(".svg") || value.startsWith("data:image/svg"));

// Fixed bottom navigation bar
const MobileBottomNav = ({ onSearchClick, isSearchOpen }: { onSearchClick: () => void; isSearchOpen: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useItineraryUpdates();

  const handleNavClick = useCallback((targetPath: string, isCurrentlyActive: boolean) => {
    if (isCurrentlyActive) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(targetPath);
  }, [navigate]);

  const handleHomeClick = useCallback(() => {
    if (isSearchOpen) {
      onSearchClick();
      return;
    }
    const isHome = location.pathname === "/" && !location.search;
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }, [location.pathname, location.search, navigate, isSearchOpen, onSearchClick]);

  const handleSearchClick = useCallback(() => {
    if (isSearchOpen) return;
    onSearchClick();
  }, [isSearchOpen, onSearchClick]);

  const navItems = [
    { icon: Home, label: "Home", action: handleHomeClick, isActive: location.pathname === "/" && !isSearchOpen, badge: 0 },
    { icon: Search, label: "Search", action: handleSearchClick, isActive: isSearchOpen, badge: 0 },
    { icon: ListMusic, label: "Your Itinerary", action: () => handleNavClick("/my-itineraries", location.pathname === "/my-itineraries" && !isSearchOpen), isActive: location.pathname === "/my-itineraries" && !isSearchOpen, badge: unreadCount },
    { icon: User, label: "Profile", action: () => handleNavClick("/profile", location.pathname === "/profile" && !isSearchOpen), isActive: location.pathname === "/profile" && !isSearchOpen, badge: 0 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {navItems.map(({ icon: Icon, label, action, isActive, badge }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 relative"
          >
            <div className="relative">
              <Icon className={cn("w-[22px] h-[22px]", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={isActive ? 2.5 : 2} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </div>
            <span className={cn("text-[10px]", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// City selector sheet - slides in from right
const CitySelectorSheet = ({
  open,
  onOpenChange,
  selectedCity,
  onCityChange,
  selectableCities,
  comingSoonCities,
  countryFlags,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectableCities: DbCity[];
  comingSoonCities: DbCity[];
  countryFlags: Record<string, string>;
  loading: boolean;
}) => (
    <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-[320px] p-0 border-l border-border flex flex-col h-full">
      {/* Close button */}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-foreground" />
      </button>
      <div className="px-5 pt-6 pb-4 flex-1 overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground mb-1">Select city</h2>
        <p className="text-sm text-muted-foreground mb-5">Choose where to explore</p>

        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {selectableCities.map((city) => {
                const isSelected = normalize(selectedCity) === normalize(city.name);
                const flag = city.flag_svg_url || countryFlags[city.country] || city.flag_emoji;
                return (
                  <button
                    key={city.id}
                    onClick={() => onCityChange(isSelected ? "" : city.name)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98]",
                      isSelected ? "bg-primary/10 border border-primary/30" : "bg-card border border-border/60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm bg-muted flex items-center justify-center">
                      {flag ? isSvg(flag) ? <img src={flag} alt={`${city.country} flag`} className="w-full h-full object-cover" /> : <span className="text-lg">{flag}</span> : <Map className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-foreground")}>{city.name}</p>
                      <p className="text-xs text-muted-foreground">{city.airport_code || city.country}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {comingSoonCities.length > 0 && (
              <>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coming soon</p>
                </div>
                <div className="space-y-1.5">
                  {comingSoonCities.map((city) => {
                    const csFlag = countryFlags[city.country] || city.flag_svg_url || city.flag_emoji;
                    return (
                    <div key={city.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {csFlag && isSvg(csFlag) ? <img src={csFlag} alt="" className="w-full h-full object-cover" /> : csFlag ? <span className="text-sm">{csFlag}</span> : <Map className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{city.name}</p></div>
                      <span className="text-[10px] text-muted-foreground">{formatLaunchMonth(city.launch_date)}</span>
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </SheetContent>
  </Sheet>
);

// City button - map icon default, selected city flag/code when active
const CityButton = ({ selectedCity, selectedCityData, countryFlags, onTap }: { selectedCity: string; selectedCityData: DbCity | null; countryFlags: Record<string, string>; onTap: () => void }) => {
  const isActive = !!selectedCityData;
  const code = selectedCityData?.airport_code || "";
  const flag = selectedCityData ? (countryFlags[selectedCityData.country] || selectedCityData.flag_svg_url || selectedCityData.flag_emoji) : "";

  return (
    <button onClick={onTap} className="flex flex-col items-center justify-center gap-0.5 transition-all">
      {isActive ? (
        <>
          <div className="w-7 h-7 rounded-full relative overflow-hidden shadow-sm bg-muted flex items-center justify-center">
            {flag ? isSvg(flag) ? <img src={flag} alt={`${selectedCityData?.country || 'country'} flag`} className="w-full h-full object-cover" /> : <span className="text-sm">{flag}</span> : <Map className="w-4 h-4 text-muted-foreground" />}
          </div>
          <span className="text-[8px] font-bold text-foreground tracking-wide leading-none">{code}</span>
        </>
      ) : (
        <Map className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
      )}
    </button>
  );
};

// Top header bar
const MobileTopBar = ({
  selectedCity,
  selectedCityData,
  countryFlags,
  hideAvatar = false,
  notFixed = false,
  onCityTap,
}: {
  selectedCity: string;
  selectedCityData: DbCity | null;
  countryFlags: Record<string, string>;
  hideAvatar?: boolean;
  notFixed?: boolean;
  onCityTap: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "top-0 left-0 right-0 z-50 bg-background safe-area-inset-top",
      notFixed ? "relative" : "fixed"
    )}>
      <div className="px-0 pt-1 pb-2">
        <div className="flex items-center justify-between bg-white mx-0 px-5 py-3 w-full">
          <button onClick={() => navigate('/')} className="text-[22px] tracking-[-0.03em] text-foreground" style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", fontWeight: 800, letterSpacing: '-0.5px' }}>
            swam<span className="text-primary font-extrabold">.app</span>
          </button>
          <CityButton selectedCity={selectedCity} selectedCityData={selectedCityData} countryFlags={countryFlags} onTap={onCityTap} />
        </div>
      </div>
    </div>
  );
};

interface MobileShellProps {
  children: ReactNode;
  headerContent?: ReactNode;
  hideTopBar?: boolean;
  hideAvatar?: boolean;
  notFixed?: boolean;
  className?: string;
}

export const MobileShell = ({ children, headerContent, hideTopBar = false, hideAvatar = false, notFixed = false, className }: MobileShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cities = [], isLoading: citiesLoading } = useCities();

  // Global city state: URL param takes priority, fallback to localStorage
  const urlCity = searchParams.get("city") || "";
  const [selectedCity, setSelectedCity] = useState(() => urlCity || getPersistedCity());

  const countryFlags = useMemo(() => {
    const map: Record<string, string> = {};
    cities.forEach((city) => {
      const key = city.country || "";
      if (!key || map[key]) return;
      const flag = city.flag_svg_url || city.flag_emoji || "";
      if (flag) map[key] = flag;
    });
    return map;
  }, [cities]);

  const selectableCities = useMemo(() => cities.filter(isLaunched).sort((a, b) => a.name.localeCompare(b.name)), [cities]);
  const comingSoonCities = useMemo(() => cities.filter((c) => !isLaunched(c)).sort((a, b) => (a.launch_date || "").localeCompare(b.launch_date || "")), [cities]);

  const selectedCityData = useMemo(() => {
    if (!selectedCity) return null;
    const key = normalize(selectedCity);
    return cities.find((city) => normalize(city.name) === key) || null;
  }, [cities, selectedCity]);

  // Sync from URL → state + localStorage when URL changes
  useEffect(() => {
    if (urlCity) {
      setSelectedCity(urlCity);
      persistCity(urlCity);
    }
  }, [urlCity]);

  // On mount, if localStorage has a city but URL doesn't, keep showing it
  useEffect(() => {
    const persisted = getPersistedCity();
    if (persisted && !urlCity) {
      setSelectedCity(persisted);
    }
  }, [location.pathname]);

  // Callback when search or map changes the city
  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    persistCity(city);
    const params = new URLSearchParams(window.location.search);
    if (city) params.set("city", city);
    else params.delete("city");
    const newSearch = params.toString();
    navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}`, { replace: true });
  }, [navigate, location.pathname]);

  // Scroll to top on ALL route changes (every tab switch)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('main')?.scrollTo(0, 0);
  }, [location.pathname]);

  // City selector sheet state
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => { setSearchQuery(q); setMobileSearchOpen(false); navigate("/?q=" + encodeURIComponent(q)); }}
        initialCity={selectedCity}
        onCityChange={handleCityChange}
      />

      <CitySelectorSheet
        open={citySelectorOpen}
        onOpenChange={setCitySelectorOpen}
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        selectableCities={selectableCities}
        comingSoonCities={comingSoonCities}
        countryFlags={countryFlags}
        loading={citiesLoading}
      />

      {!hideTopBar && (
        <MobileTopBar
          selectedCity={selectedCity}
          selectedCityData={selectedCityData}
          countryFlags={countryFlags}
          hideAvatar={hideAvatar}
          notFixed={notFixed}
          onCityTap={() => setCitySelectorOpen(true)}
        />
      )}

      <div className={cn(!hideTopBar && !notFixed && "pt-[72px]", "pb-20")}>
        {children}
      </div>

      <MobileBottomNav onSearchClick={() => setMobileSearchOpen(prev => !prev)} isSearchOpen={mobileSearchOpen} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};