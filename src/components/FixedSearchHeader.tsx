import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserCircle, User, LogOut, Map, MapPin, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    const scrollContainer = document.querySelector('main.overflow-auto');
    const handleScroll = () => {
      const currentScrollY = scrollContainer ? (scrollContainer as HTMLElement).scrollTop : window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;
      if (scrollingDown && currentScrollY > 60) setIsVisible(false);
      else setIsVisible(true);
      setLastScrollY(currentScrollY);
    };
    const target = scrollContainer || window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* City selector dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a city</DialogTitle>
            <p className="text-sm text-muted-foreground">Select a city to explore experiences</p>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {mapCities.map((city) => (
              <button
                key={city.name}
                disabled={!city.available}
                onClick={() => {
                  if (city.available) {
                    if (selectedCity?.name === city.name) onCitySelect(null);
                    else onCitySelect({ id: city.name.toLowerCase().replace(/\s+/g, '-'), name: city.name, color: '#000' } as City);
                    setCityDialogOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left",
                  city.available
                    ? selectedCity?.name === city.name
                      ? "bg-primary/8 border border-primary/20"
                      : "bg-background border border-border/50 hover:border-border hover:bg-muted/30"
                    : "bg-muted/30 border border-border/20 opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  city.available ? "bg-primary/8" : "bg-muted"
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
          "sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-300 ease-out",
          !isVisible && "-translate-y-full"
        )}
      >
        <div className="px-4 md:px-8 lg:px-10 md:pl-16 py-3">
          <div className="flex items-center gap-3">
            {/* Left: SWAM logo (mobile only) */}
            <Link to="/" className="md:hidden shrink-0">
              <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
            </Link>

            {/* Center: Search bar */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="What do you want to explore?"
                  className="pl-11 pr-10 h-10 text-sm bg-muted/50 border border-border/50 rounded-full focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30 placeholder:text-muted-foreground/60 hover:bg-muted/70 hover:border-border transition-all duration-200"
                  style={{ fontSize: "14px" }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: City + Map + Profile */}
            <div className="flex items-center gap-2 ml-auto">
              {selectedCity && (
                <button
                  onClick={() => onCitySelect(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold hover:bg-primary/12 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {selectedCity.name}
                  <X className="w-3 h-3 ml-0.5 opacity-60" />
                </button>
              )}
              <button 
                onClick={() => setCityDialogOpen(true)} 
                className="p-2.5 rounded-full bg-muted/50 border border-border/50 hover:bg-muted hover:border-border transition-all duration-200"
              >
                <Map className="w-4.5 h-4.5 text-foreground/80" strokeWidth={2} />
              </button>

              {!isMobile && (
                <div className="shrink-0">
                  {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-muted/70">
                          <UserCircle className="w-5 h-5" />
                          <span className="max-w-[100px] truncate text-sm">
                            {userProfile?.username || userProfile?.full_name || user?.email?.split('@')[0]}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg mx-1">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="text-destructive rounded-lg mx-1">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button 
                      size="sm" 
                      className="rounded-full px-5 font-semibold text-sm" 
                      onClick={() => setAuthModalOpen(true)}
                    >
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