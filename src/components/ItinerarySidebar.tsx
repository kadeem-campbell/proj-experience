import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Globe, 
  Lock,
  ChevronDown,
  ChevronRight,
  Compass,
  Search,
  UserCircle,
  Sparkles,
  LogOut,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { RotatingStatModule } from "@/components/RotatingStatModule";
import { SidebarItineraryCTA } from "@/components/SidebarItineraryCTA";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { City, cities } from "@/data/browseData";

interface ItinerarySidebarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
  onMobileSearchClick?: () => void;
}

// Auto-dismiss hint component
const AutoDismissHint = ({ onDismiss }: { onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="mx-2 mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20 relative animate-in fade-in duration-300">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Your Trip Planner</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save experiences here to build your perfect Zanzibar itinerary
          </p>
        </div>
      </div>
    </div>
  );
};

export const ItinerarySidebar = ({
  searchQuery = "",
  onSearchChange,
  selectedCity,
  onCitySelect,
  onMobileSearchClick,
}: ItinerarySidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [locationOpen, setLocationOpen] = useState(false);
  
  const {
    itineraries,
    activeItinerary,
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    deleteItinerary,
    renameItinerary,
    togglePublic
  } = useItineraries();

  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [itinerariesOpen, setItinerariesOpen] = useState(true);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const [highlightItineraries, setHighlightItineraries] = useState(false);

  useEffect(() => {
    const hasSeenSidebarGuide = localStorage.getItem('hasSeenSidebarGuide');
    if (!hasSeenSidebarGuide) {
      setShowOnboardingHint(true);
    }
  }, []);

  // Listen for event to open and highlight itineraries section
  useEffect(() => {
    const handleOpenItineraries = () => {
      setItinerariesOpen(true);
      setHighlightItineraries(true);
      setTimeout(() => setHighlightItineraries(false), 2000);
    };
    
    window.addEventListener('openItinerariesSidebar', handleOpenItineraries);
    return () => window.removeEventListener('openItinerariesSidebar', handleOpenItineraries);
  }, []);

  const dismissOnboardingHint = () => {
    localStorage.setItem('hasSeenSidebarGuide', 'true');
    setShowOnboardingHint(false);
  };

  const handleCreate = () => {
    if (newItineraryName.trim()) {
      createItinerary(newItineraryName.trim());
      setNewItineraryName("");
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameItinerary(id, editName.trim());
      setEditingId(null);
    }
  };

  // Show + button only if user has 2+ itineraries
  const showPlusButton = itineraries.length >= 2;

  const [searchFocused, setSearchFocused] = useState(false);
  
  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  const suggestedTags = ["Beach", "Adventure", "Food", "Wildlife", "Party", "Culture"];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card">
      <SidebarHeader className="p-4 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              SWAM
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* No separator - removed for cleaner look */}

      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Discover row with expanded search */}
          <SidebarGroup className="py-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {collapsed ? (
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === "/"}
                      tooltip="Discover"
                    >
                      <Link to="/" className="flex items-center justify-center">
                        <Compass className="w-4 h-4" />
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <Popover open={searchFocused} onOpenChange={setSearchFocused}>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton className={cn(
                          "w-full justify-start",
                          searchFocused && "bg-muted"
                        )}>
                          <Search className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-left truncate text-muted-foreground">
                            {searchQuery || "Search..."}
                          </span>
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent 
                        align="start" 
                        side="bottom"
                        sideOffset={4}
                        className="w-[--radix-popover-trigger-width] p-0 bg-card border border-border shadow-xl"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center bg-muted/60 rounded-lg px-3 py-2">
                            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                            <Input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => onSearchChange?.(e.target.value)}
                              placeholder="Search experiences..."
                              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-5 text-sm placeholder:text-muted-foreground"
                              style={{ fontSize: '16px' }}
                              autoFocus
                            />
                            {searchQuery && (
                              <button
                                onClick={() => onSearchChange?.("")}
                                className="p-0.5 hover:bg-muted-foreground/20 rounded-full transition-colors"
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
                          {/* Recent Searches */}
                          {recentSearches.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Recent</p>
                              <div className="space-y-0.5">
                                {recentSearches.map((search, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      onSearchChange?.(search);
                                      setSearchFocused(false);
                                    }}
                                    className="w-full flex items-center gap-2 text-sm py-2 px-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    {search}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Suggested Tags */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Categories</p>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestedTags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    onSearchChange?.(tag);
                                    setSearchFocused(false);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Recommended Searches */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Try searching</p>
                            <div className="space-y-0.5">
                              {[
                                "Find me somewhere to party 🎉",
                                "What beaches are cool right now? 🏖️",
                                "Best local food experiences 🍽️",
                                "Adventure activities nearby 🚀"
                              ].map((suggestion, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    onSearchChange?.(suggestion.replace(/[🎉🏖️🍽️🚀]/g, '').trim());
                                    setSearchFocused(false);
                                  }}
                                  className="w-full flex items-center gap-2 text-sm py-2 px-2 rounded-lg hover:bg-muted transition-colors text-foreground/80"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Location filter - unified with sidebar style */}
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton 
                        tooltip="Location" 
                        className={cn(selectedCity && "text-primary")}
                      >
                        <MapPin className="w-4 h-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate">
                              {selectedCity?.name || "All Locations"}
                            </span>
                            <ChevronDown className={cn(
                              "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                              locationOpen && "rotate-180"
                            )} />
                          </>
                        )}
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent 
                      align="start" 
                      side={collapsed ? "right" : "bottom"}
                      className="w-56 p-2 bg-card border border-border shadow-xl"
                    >
                      <div className="space-y-0.5">
                        {selectedCity && (
                          <button
                            onClick={() => {
                              onCitySelect?.(null);
                              setLocationOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Clear location
                          </button>
                        )}
                        {cities.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => {
                              onCitySelect?.(city);
                              setLocationOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors",
                              selectedCity?.id === city.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: city.color }}
                            />
                            <span>{city.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mx-4 my-3 h-px bg-border/40" />

          {/* Itinerary CTA - only for 0-1 itineraries */}
          <SidebarItineraryCTA collapsed={collapsed} />

          {/* Itineraries */}
          <SidebarGroup className={cn(
            "transition-all duration-500",
            highlightItineraries && "bg-primary/10 rounded-lg ring-2 ring-primary/30"
          )}>
            {/* Onboarding hint for first-time users - auto dismisses */}
            {showOnboardingHint && !collapsed && (
              <AutoDismissHint onDismiss={dismissOnboardingHint} />
            )}

            <Collapsible open={itinerariesOpen} onOpenChange={setItinerariesOpen}>
              <div className="flex items-center justify-between pr-2">
                <CollapsibleTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1 text-muted-foreground uppercase text-xs tracking-wider hover:text-foreground transition-colors p-2",
                    highlightItineraries && "text-primary font-semibold"
                  )}>
                    {itinerariesOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {!collapsed && "My Itineraries"}
                  </button>
                </CollapsibleTrigger>
                {!collapsed && showPlusButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <CollapsibleContent>
                <SidebarGroupContent>
                  {/* New Itinerary Input */}
                  {isCreating && !collapsed && (
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newItineraryName}
                          onChange={(e) => setNewItineraryName(e.target.value)}
                          placeholder="Trip name..."
                          className="h-10 text-base"
                          style={{ fontSize: '16px' }}
                          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                          autoFocus
                        />
                        <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleCreate}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 shrink-0"
                          onClick={() => setIsCreating(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <SidebarMenu>
                    {itineraries.map((itinerary) => (
                      <SidebarMenuItem key={itinerary.id}>
                        {editingId === itinerary.id && !collapsed ? (
                          <div className="flex items-center gap-2 px-2 py-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-10 text-base"
                              style={{ fontSize: '16px' }}
                              onKeyDown={(e) => e.key === "Enter" && handleRename(itinerary.id)}
                              autoFocus
                            />
                            <Button 
                              size="icon" 
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleRename(itinerary.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 shrink-0"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <SidebarMenuButton
                            isActive={activeItineraryId === itinerary.id}
                            onClick={() => {
                              setActiveItinerary(itinerary.id);
                              navigate(`/trip/${itinerary.id}`);
                            }}
                            className="group/item"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {itinerary.isPublic ? (
                                <Globe className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              {!collapsed && (
                                <>
                                  <span className="truncate">{itinerary.name}</span>
                                  <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                                    {itinerary.experiences.length}
                                  </Badge>
                                </>
                              )}
                            </div>
                            
                            {!collapsed && (
                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 ml-2">
                                <span
                                  role="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePublic(itinerary.id);
                                  }}
                                >
                                  {itinerary.isPublic ? (
                                    <Lock className="w-3 h-3" />
                                  ) : (
                                    <Globe className="w-3 h-3" />
                                  )}
                                </span>
                                <span
                                  role="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(itinerary.id);
                                    setEditName(itinerary.name);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </span>
                                {itineraries.length > 1 && (
                                  <span
                                    role="button"
                                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-destructive hover:text-destructive cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItinerary(itinerary.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            )}
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {/* Rotating stats module - replaces About */}
          <SidebarMenuItem>
            <RotatingStatModule collapsed={collapsed} />
          </SidebarMenuItem>

          {/* Mobile: Show Sign Up / User info */}
          {isMobile && (
            <SidebarMenuItem>
              {isAuthenticated ? (
                <>
                  <SidebarMenuButton
                    onClick={() => navigate('/profile')}
                    className="mb-1"
                  >
                    <UserCircle className="w-4 h-4" />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">
                          {userProfile?.username || userProfile?.full_name || user?.email?.split('@')[0]}
                        </div>
                      </div>
                    )}
                  </SidebarMenuButton>
                  <SidebarMenuButton onClick={signOut} className="text-destructive">
                    <LogOut className="w-4 h-4" />
                    {!collapsed && <span>Sign out</span>}
                  </SidebarMenuButton>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              )}
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      {/* Auth Modal for mobile sign up */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};
