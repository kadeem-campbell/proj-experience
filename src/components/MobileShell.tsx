import { useState, useCallback, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ListMusic, User, Settings, HelpCircle, Map, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useItineraries } from "@/hooks/useItineraries";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { cn } from "@/lib/utils";

// Spotify-style left slide-out profile menu
const ProfileSlideMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "Guest";

  const menuItems = [
    { icon: User, label: "View Profile", action: () => navigate("/profile") },
    { icon: Settings, label: "Settings", action: () => navigate("/profile") },
    { icon: HelpCircle, label: "Contact Support", action: () => navigate("/about") },
    { icon: Map, label: "Build Itineraries", action: () => navigate("/itineraries") },
  ];

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-[61] w-[75vw] max-w-[300px] bg-background border-r border-border shadow-xl transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 pt-[calc(env(safe-area-inset-top,12px)+12px)] border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
          {user?.email && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
          )}
        </div>
        <div className="flex-1 py-3">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={() => { action(); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[15px] font-medium text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Fixed bottom navigation bar - solid white, strong
const MobileBottomNav = ({ onSearchClick, isSearchOpen }: { onSearchClick: () => void; isSearchOpen: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { experienceCount } = useItineraries();

  const handleHomeClick = useCallback(() => {
    if (location.pathname === "/" && !location.search) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }, [location.pathname, location.search, navigate]);

  const navItems = [
    { icon: Home, label: "Home", action: handleHomeClick, isActive: location.pathname === "/" && !isSearchOpen, badge: 0 },
    { icon: Search, label: "Search", action: onSearchClick, isActive: isSearchOpen, badge: 0 },
    { icon: ListMusic, label: "Your Itinerary", action: () => navigate("/my-itineraries"), isActive: location.pathname === "/my-itineraries" && !isSearchOpen, badge: experienceCount },
    { icon: User, label: "Profile", action: () => navigate("/profile"), isActive: location.pathname === "/profile" && !isSearchOpen, badge: 0 },
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

// Top header bar
const MobileTopBar = ({ 
  onProfileClick, 
  headerContent,
  hideAvatar = false,
  notFixed = false,
}: { 
  onProfileClick: () => void;
  headerContent?: ReactNode;
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
          <button onClick={onProfileClick} className="text-[22px] tracking-[-0.03em] text-foreground" style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", fontWeight: 800, letterSpacing: '-0.5px' }}>
            swam<span className="text-primary font-extrabold">.app</span>
          </button>
          <div className="flex items-center gap-2">
            {headerContent}
            <button 
              onClick={() => navigate("/map")} 
              className="w-9 h-9 rounded-full bg-[#f5f5f5] flex items-center justify-center"
            >
              <Map className="w-5 h-5 text-[#121212]" strokeWidth={2.2} />
            </button>
          </div>
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => { setSearchQuery(q); setMobileSearchOpen(false); navigate("/?q=" + encodeURIComponent(q)); }}
      />
      <ProfileSlideMenu isOpen={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} />

      {!hideTopBar && (
        <MobileTopBar 
          onProfileClick={() => setProfileMenuOpen(true)} 
          headerContent={headerContent}
          hideAvatar={hideAvatar}
          notFixed={notFixed}
        />
      )}

      {/* Content area */}
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
