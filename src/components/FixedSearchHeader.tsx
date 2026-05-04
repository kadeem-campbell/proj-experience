import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserCircle, User, LogOut, Map, MapPin, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BrowseDestination } from "@/hooks/useDestinations";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import { useDestinations } from "@/hooks/useDestinations";
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

interface FixedSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: BrowseDestination | null;
  onCitySelect: (city: BrowseDestination | null) => void;
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
  const { data: destinations = [] } = useDestinations();

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
      
      {/* Destination selector dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select destination</DialogTitle>
            <p className="text-sm text-muted-foreground">Choose a destination to explore</p>
          </DialogHeader>
          <div className="space-y-2 mt-3">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => {
                  if (selectedCity?.id === dest.id) onCitySelect(null);
                  else onCitySelect(dest);
                  setCityDialogOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left",
                  selectedCity?.id === dest.id
                    ? "bg-primary/8 border border-primary/20"
                    : "bg-background border border-border/50 hover:border-border hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                  "bg-primary/8"
                )}>
                  {dest.flag_svg_url ? (
                    <img src={dest.flag_svg_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {dest.name}
                  </h3>
                </div>
                {selectedCity?.id === dest.id && (
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
        <div className="px-4 md:px-8 lg:px-10 py-3">
          <div className="flex items-center gap-3">
            {/* Left: SWAM logo (mobile only) */}
            <Link to="/" className="md:hidden shrink-0">
              <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
            </Link>

            {/* Center: Segmented search bar — destination + query (Airbnb-inspired) */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="flex items-stretch w-full max-w-[680px] h-12 rounded-full bg-background border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden">
                {/* Where */}
                <button
                  onClick={() => setCityDialogOpen(true)}
                  className="flex items-center gap-2.5 pl-5 pr-4 hover:bg-muted/50 transition-colors min-w-0 max-w-[42%]"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedCity?.flag_svg_url ? (
                      <img src={selectedCity.flag_svg_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">Where</div>
                    <div className="text-[13px] font-semibold text-foreground truncate leading-tight">
                      {selectedCity?.name || "Anywhere"}
                    </div>
                  </div>
                </button>

                <div className="w-px bg-border/60 my-2.5" />

                {/* What — search input */}
                <div className="flex-1 relative flex items-center">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search things to do…"
                    className="h-full pl-5 pr-14 text-[14px] bg-transparent border-0 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ) : (
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-2 ml-auto">
            {/* Right: Destination + Map + Profile */}
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
