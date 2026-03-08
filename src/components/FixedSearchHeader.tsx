import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserCircle, User, LogOut, Map, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { City } from "@/data/browseData";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const mapCities = [
  { name: "Zanzibar", available: true },
  { name: "Dar es Salaam", available: true },
  { name: "Entebbe", available: false, launchDate: "18 March" },
  { name: "Kampala", available: false, launchDate: "20 March" },
  { name: "Nairobi", available: false, launchDate: "21 March" },
  { name: "Cape Town", available: false, launchDate: "1 April" },
];

interface FixedSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onMobileSearchClick?: () => void;
  isMobile?: boolean;
}

export const FixedSearchHeader = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  selectedCategory,
  onCategorySelect,
  onMobileSearchClick,
  isMobile = false,
}: FixedSearchHeaderProps) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Hide on scroll down, show on scroll up (TikTok-style)
  useEffect(() => {
    const scrollContainer = document.querySelector('main.overflow-auto');
    
    const handleScroll = () => {
      const currentScrollY = scrollContainer 
        ? (scrollContainer as HTMLElement).scrollTop 
        : window.scrollY;
      
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollThreshold = 10;

      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      if (scrollingDown && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    const target = scrollContainer || window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* City selector dialog - desktop version of mobile drawer */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a city</DialogTitle>
            <p className="text-sm text-muted-foreground">Select a city to explore experiences</p>
          </DialogHeader>
          <div className="space-y-2.5 mt-2">
            {mapCities.map((city) => (
              <button
                key={city.name}
                disabled={!city.available}
                onClick={() => {
                  if (city.available) {
                    // Toggle: if same city selected, clear it
                    if (selectedCity?.name === city.name) {
                      onCitySelect(null);
                    } else {
                      onCitySelect({ id: city.name.toLowerCase().replace(/\s+/g, '-'), name: city.name, color: '#000' } as City);
                    }
                    setCityDialogOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                  city.available
                    ? selectedCity?.name === city.name
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-background border border-border/60 hover:bg-muted/50"
                    : "bg-muted/40 border border-border/30 opacity-60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  city.available ? "bg-primary/10" : "bg-muted"
                )}>
                  <MapPin className={cn("w-5 h-5", city.available ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("text-[15px] font-semibold", city.available ? "text-foreground" : "text-muted-foreground")}>
                    {city.name}
                  </h3>
                  {!city.available && city.launchDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">Coming {city.launchDate}</p>
                  )}
                  {city.available && (
                    <p className="text-xs text-primary mt-0.5">Available now</p>
                  )}
                </div>
                {city.available && selectedCity?.name === city.name && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div 
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 bg-background border-b border-border transition-transform duration-300 ease-out",
          !isVisible && "-translate-y-full"
        )}
      >
        {/* Header row - left padding accounts for fixed sidebar toggle button */}
        <div className="px-4 md:px-6 md:pl-14 py-3">
          <div className="flex items-center justify-between md:justify-end">
            {/* Left: SWAM logo (mobile only) */}
            <Link to="/" className="md:hidden">
              <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
            </Link>

            {/* Right: City filter + Map + Profile */}
            <div className="flex items-center gap-2">
              {selectedCity && (
                <button
                  onClick={() => onCitySelect(null)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                >
                  <MapPin className="w-3 h-3" />
                  {selectedCity.name}
                  <span className="ml-0.5 text-primary/60">✕</span>
                </button>
              )}
              <button 
                onClick={() => setCityDialogOpen(true)} 
                className="p-2 bg-muted/60 rounded-xl hover:bg-muted transition-colors"
              >
                <Map className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>

              {/* Desktop: Sign Up / User dropdown */}
              {!isMobile && (
                <div className="shrink-0">
                  {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <UserCircle className="w-5 h-5" />
                          <span className="max-w-[120px] truncate">
                            {userProfile?.username || userProfile?.full_name || user?.email?.split('@')[0]}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="text-destructive">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button size="sm" onClick={() => setAuthModalOpen(true)}>
                      Sign Up
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
