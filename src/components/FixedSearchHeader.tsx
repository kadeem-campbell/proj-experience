import { useState, useRef } from "react";
import { Search, MapPin, ChevronDown, X, PanelLeft, UserCircle, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { City, cities } from "@/data/browseData";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Category tags for quick filtering
const categoryTags = [
  { id: "water-sports", name: "Water Sports", color: "hsl(200, 70%, 50%)" },
  { id: "party", name: "Party", color: "hsl(280, 70%, 55%)" },
  { id: "food", name: "Food", color: "hsl(30, 70%, 50%)" },
  { id: "beach", name: "Beach", color: "hsl(180, 60%, 50%)" },
  { id: "safari", name: "Safari", color: "hsl(45, 70%, 50%)" },
  { id: "adventure", name: "Adventure", color: "hsl(120, 50%, 45%)" },
  { id: "culture", name: "Culture", color: "hsl(340, 60%, 55%)" },
  { id: "wellness", name: "Wellness", color: "hsl(160, 60%, 45%)" },
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const { toggleSidebar } = useSidebar();
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategorySelect(null);
    } else {
      onCategorySelect(categoryName);
    }
  };

  const clearFilters = () => {
    onCitySelect(null);
    onCategorySelect(null);
  };

  return (
    <>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        {/* Search bar row */}
        <div className="px-3 md:px-4 py-2.5">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0 h-9 w-9 rounded-lg"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>

            {/* Search input - constrained width on desktop */}
            <div className="flex-1 min-w-0 md:max-w-md">
              {isMobile ? (
                <button
                  onClick={onMobileSearchClick}
                  className="flex items-center w-full bg-muted/60 border border-border/50 rounded-xl px-4 py-2.5 text-left"
                >
                  <Search className="w-4 h-4 text-foreground/60 mr-2.5 shrink-0" />
                  <span className="text-foreground/50 text-sm truncate">
                    {searchQuery || "Search experiences..."}
                  </span>
                </button>
              ) : (
                <div className="flex items-center bg-muted/60 border border-border/50 rounded-xl px-4 py-2">
                  <Search className="w-4 h-4 text-foreground/60 mr-2.5 shrink-0" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search experiences..."
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-foreground/50"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="ml-2 p-1 hover:bg-muted rounded-full"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Sign Up / User dropdown */}
            {!isMobile && (
              <div className="ml-auto shrink-0">
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

      {/* Location + Category tags row */}
      <div className="px-3 md:px-4 pb-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" ref={tagsContainerRef}>
          {/* Location picker */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 rounded-full gap-1.5 px-3 h-7 text-xs border-border/60",
                  selectedCity && "border-primary bg-primary/10 text-primary"
                )}
              >
                <MapPin className="w-3 h-3" />
                <span>{selectedCity?.name || "Location"}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2">
              <div className="space-y-1">
                {selectedCity && (
                  <button
                    onClick={() => {
                      onCitySelect(null);
                      setLocationOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                  >
                    <X className="w-4 h-4" />
                    Clear location
                  </button>
                )}
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      onCitySelect(city);
                      setLocationOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      selectedCity?.id === city.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: city.color }}
                    />
                    {city.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Separator */}
          <div className="w-px h-4 bg-border/60 shrink-0" />

          {/* Category tags */}
          {categoryTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleCategoryClick(tag.name)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                selectedCategory === tag.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              {tag.name}
            </button>
          ))}

          {/* Clear filters */}
          {(selectedCity || selectedCategory) && (
            <>
              <div className="w-px h-4 bg-border/60 shrink-0" />
              <button
                onClick={clearFilters}
                className="shrink-0 px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
};