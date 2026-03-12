import { useState, useCallback, useEffect, ReactNode } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Home, Search, ListMusic, User, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useItineraryUpdates } from "@/hooks/useItineraryUpdates";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { cn } from "@/lib/utils";

const cityCodeMap: Record<string, string> = {
  "Zanzibar": "ZNZ",
  "Dar es Salaam": "DAR",
};

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

// City globe button - replaces map icon, same size
const CityGlobeButton = ({ selectedCity }: { selectedCity: string }) => {
  const navigate = useNavigate();
  const code = selectedCity ? cityCodeMap[selectedCity] : "";
  const isActive = !!selectedCity;

  return (
    <button
      onClick={() => navigate("/map")}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden transition-all",
        isActive ? "bg-primary" : "bg-muted"
      )}
    >
      {/* Globe icon in background */}
      <Globe
        className={cn(
          "w-7 h-7 absolute",
          isActive ? "text-primary-foreground/20" : "text-muted-foreground/30"
        )}
        strokeWidth={1.2}
      />
      {/* Airport code on top */}
      {isActive ? (
        <span className="relative z-10 text-[10px] font-extrabold text-primary-foreground tracking-wide">
          {code}
        </span>
      ) : (
        <Globe
          className="w-5 h-5 relative z-10 text-muted-foreground"
          strokeWidth={2}
        />
      )}
    </button>
  );
};

// Top header bar
const MobileTopBar = ({
  selectedCity,
  hideAvatar = false,
  notFixed = false,
}: {
  selectedCity: string;
  hideAvatar?: boolean;
  notFixed?: boolean;
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
          <CityGlobeButton selectedCity={selectedCity} />
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

  // Global city state from URL
  const selectedCity = searchParams.get("city") || "";

  // Callback when search changes the city
  const handleCityChange = useCallback((city: string) => {
    const params = new URLSearchParams(window.location.search);
    if (city) {
      params.set("city", city);
    } else {
      params.delete("city");
    }
    const newSearch = params.toString();
    navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}`, { replace: true });
  }, [navigate, location.pathname]);

  // Scroll to top on route change, except homepage
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
      document.querySelector('main')?.scrollTo(0, 0);
    }
  }, [location.pathname]);

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

      {!hideTopBar && (
        <MobileTopBar
          selectedCity={selectedCity}
          hideAvatar={hideAvatar}
          notFixed={notFixed}
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