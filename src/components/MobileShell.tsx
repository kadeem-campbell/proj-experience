import { useState, useCallback, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ListMusic, PlusCircle, User, Settings, HelpCircle, Map, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-[61] w-[75vw] max-w-[300px] bg-card border-r border-border transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 pt-[calc(env(safe-area-inset-top,12px)+12px)] border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
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

// Fixed bottom navigation bar with gradient
const MobileBottomNav = ({ onSearchClick }: { onSearchClick: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = useCallback(() => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  const navItems = [
    { icon: Home, label: "Home", action: handleHomeClick, isActive: location.pathname === "/" },
    { icon: Search, label: "Search", action: onSearchClick, isActive: false },
    { icon: ListMusic, label: "Your Itinerary", action: () => navigate("/itineraries"), isActive: location.pathname === "/itineraries" },
    { icon: User, label: "Profile", action: () => navigate("/profile"), isActive: location.pathname === "/profile" },
    { icon: PlusCircle, label: "Create", action: () => navigate("/itineraries?create=true"), isActive: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 -top-12 pointer-events-none bg-gradient-to-t from-[hsl(0,0%,7.1%)] via-[hsl(0,0%,7.1%,0.8)] to-transparent" />
      <div className="relative flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {navItems.map(({ icon: Icon, label, action, isActive }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center gap-1 min-w-[60px] py-1"
          >
            <Icon className={cn("w-6 h-6", isActive ? "text-foreground" : "text-muted-foreground")} />
            <span className={cn("text-[10px]", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Top header bar with avatar (can optionally show tabs or custom content)
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
  const { userProfile } = useAuth();
  const displayName = userProfile?.full_name || userProfile?.username || "G";

  return (
    <div className={cn(
      "top-0 left-0 right-0 z-50 bg-[hsl(0,0%,7.1%)] safe-area-inset-top",
      notFixed ? "relative" : "fixed"
    )}>
      <div className="flex items-center gap-3 px-4 pt-3 pb-3">
        {!hideAvatar && (
          <button 
            onClick={onProfileClick}
            className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">{headerContent}</div>
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={cn("min-h-screen bg-[hsl(0,0%,7.1%)]", className)}>
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => { setSearchQuery(q); setMobileSearchOpen(false); }}
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
      <div className={cn(!hideTopBar && !notFixed && "pt-16", "pb-24")}>
        {children}
      </div>

      <MobileBottomNav onSearchClick={() => setMobileSearchOpen(true)} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
