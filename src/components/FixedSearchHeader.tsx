import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserCircle, User, LogOut } from "lucide-react";
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
      
      <div 
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 bg-background border-b border-border transition-transform duration-300 ease-out",
          !isVisible && "-translate-y-full"
        )}
      >
        {/* Header row */}
        <div className="px-3 md:px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Spacer */}
            <div className="flex-1" />

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
    </>
  );
};
