import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Compass,
  Search,
  UserCircle,
  Sparkles,
  Clock,
  PanelLeftClose,
  PanelLeft,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const { state, toggleSidebar } = useSidebar();
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
    const hasSeenSidebarGuide = localStorage.getItem("hasSeenSidebarGuide");
    if (!hasSeenSidebarGuide) {
      setShowOnboardingHint(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenItineraries = () => {
      setItinerariesOpen(true);
      setHighlightItineraries(true);
      setTimeout(() => setHighlightItineraries(false), 2000);
    };
    window.addEventListener("openItinerariesSidebar", handleOpenItineraries);
    return () => window.removeEventListener("openItinerariesSidebar", handleOpenItineraries);
  }, []);

  const dismissOnboardingHint = () => {
    localStorage.setItem("hasSeenSidebarGuide", "true");
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

  const showPlusButton = itineraries.length >= 2;

  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (!searchFocused) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = searchContainerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [searchFocused]);

  const suggestedTags = ["Beach", "Adventure", "Food", "Wildlife", "Party", "Culture"];
  const searchSuggestions = [
    "Beach experiences nearby",
    "Popular food spots",
    "Adventure activities",
    "Cultural attractions",
  ];

  const isCollapsedView = collapsed || isMobile;

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r border-border/50 bg-card transition-all duration-200",
        // ChatGPT-style narrow width
        !collapsed && "w-60"
      )}
    >
      <SidebarHeader className="p-3">
        <div className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-2" : "justify-between"
        )}>
          <Link to="/" className="flex items-center">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            {!isCollapsedView && (
              <span className="ml-2 text-lg font-bold gradient-primary bg-clip-text text-transparent">SWAM</span>
            )}
          </Link>
          
          {/* Collapse/Expand button - always visible on desktop */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 shrink-0"
            >
              {collapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Discover with integrated Search - ChatGPT style compact search */}
          <SidebarGroup className="py-2">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {isCollapsedView ? (
                    <SidebarMenuButton
                      tooltip="Discover"
                      asChild
                      isActive={location.pathname === "/"}
                      className="justify-center"
                    >
                      <Link to="/">
                        <Compass className="w-4 h-4" />
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <div ref={searchContainerRef} className="w-full px-2">
                      {/* ChatGPT-style compact search bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => onSearchChange?.(e.target.value)}
                          onFocus={() => setSearchFocused(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setSearchFocused(false);
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="Search..."
                          className="pl-9 pr-8 py-2 h-9 text-sm bg-muted/50 border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
                          style={{ fontSize: "14px" }}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onSearchChange?.("");
                              searchInputRef.current?.focus();
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background/40 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      {/* Search mode dropdown */}
                      {searchFocused && (
                        <div
                          className="absolute left-2 right-2 mt-2 rounded-lg bg-popover border border-border shadow-lg overflow-hidden z-50"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="py-2 max-h-[320px] overflow-y-auto">
                            {recentSearches.length > 0 && (
                              <div className="px-3 py-2">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                                  Recent
                                </p>
                                {recentSearches.map((search, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      onSearchChange?.(search);
                                      setSearchFocused(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 text-sm py-2 px-2 -mx-2 rounded-md hover:bg-muted transition-colors text-foreground"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="truncate">{search}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="px-3 py-2">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Categories
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestedTags.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => {
                                      onSearchChange?.(tag);
                                      setSearchFocused(false);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="px-3 py-2">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                                Suggestions
                              </p>
                              {searchSuggestions.map((suggestion, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    onSearchChange?.(suggestion);
                                    setSearchFocused(false);
                                  }}
                                  className="w-full flex items-center gap-2.5 text-sm py-2 px-2 -mx-2 rounded-md hover:bg-muted transition-colors text-foreground/80"
                                >
                                  <Compass className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{suggestion}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Location filter */}
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Location"
                        className={cn(
                          isCollapsedView && "justify-center",
                          selectedCity && "text-primary"
                        )}
                      >
                        <MapPin className="w-4 h-4" />
                        {!isCollapsedView && (
                          <>
                            <span className="flex-1 text-left truncate">
                              {selectedCity?.name || "All Locations"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                                locationOpen && "rotate-180"
                              )}
                            />
                          </>
                        )}
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side={isCollapsedView ? "right" : "bottom"}
                      className="w-52 p-1.5 bg-popover border border-border shadow-lg"
                    >
                      <div className="space-y-0.5">
                        {selectedCity && (
                          <button
                            onClick={() => {
                              onCitySelect?.(null);
                              setLocationOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Clear filter
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
                              "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
                              selectedCity?.id === city.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
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

          {!isCollapsedView && <div className="mx-3 my-3 h-px bg-border/30" />}

          {/* Itinerary CTA */}
          <SidebarItineraryCTA collapsed={isCollapsedView} />

          {/* Itineraries - Cleaned up: no public/private toggle, no edit icon */}
          <SidebarGroup
            className={cn(
              "transition-all duration-500",
              highlightItineraries && "bg-primary/10 rounded-lg ring-2 ring-primary/30"
            )}
          >
            {showOnboardingHint && !isCollapsedView && (
              <AutoDismissHint onDismiss={dismissOnboardingHint} />
            )}

            {isCollapsedView ? (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="My Itineraries"
                      onClick={() => navigate("/itineraries")}
                      className="justify-center"
                    >
                      <Compass className="w-4 h-4" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              <Collapsible open={itinerariesOpen} onOpenChange={setItinerariesOpen}>
                <div className="flex items-center justify-between pr-2">
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 text-muted-foreground uppercase text-xs tracking-wider hover:text-foreground transition-colors p-2",
                        highlightItineraries && "text-primary font-semibold"
                      )}
                    >
                      {itinerariesOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      My Itineraries
                    </button>
                  </CollapsibleTrigger>

                  {showPlusButton && (
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
                    {isCreating && !isCollapsedView && (
                      <div className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={newItineraryName}
                            onChange={(e) => setNewItineraryName(e.target.value)}
                            placeholder="Trip name..."
                            className="h-9 text-sm"
                            style={{ fontSize: "14px" }}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={handleCreate}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0"
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
                          {editingId === itinerary.id && !isCollapsedView ? (
                            <div className="flex items-center gap-2 px-2 py-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9 text-sm"
                                style={{ fontSize: "14px" }}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleRename(itinerary.id)
                                }
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
                                <Compass className="w-4 h-4 text-muted-foreground shrink-0" />
                                {!isCollapsedView && (
                                  <>
                                    <span className="truncate text-sm">
                                      {itinerary.name}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="ml-auto text-xs shrink-0"
                                    >
                                      {itinerary.experiences.length}
                                    </Badge>
                                  </>
                                )}
                              </div>

                              {/* Only delete button on hover - removed edit and public/private toggle */}
                              {!isCollapsedView && itineraries.length > 1 && (
                                <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 ml-2">
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
            )}
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {!isCollapsedView && <SidebarSeparator />}

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {/* Rotating stats module */}
          {!isCollapsedView && (
            <SidebarMenuItem>
              <RotatingStatModule collapsed={isCollapsedView} />
            </SidebarMenuItem>
          )}

          {/* Profile / Sign up button */}
          <SidebarMenuItem>
            {isAuthenticated ? (
              <SidebarMenuButton
                onClick={() => navigate("/profile")}
                tooltip="Profile"
                className={isCollapsedView ? "justify-center" : ""}
              >
                <UserCircle className="w-4 h-4" />
                {!isCollapsedView && (
                  <span className="truncate text-sm">
                    {userProfile?.username ||
                      userProfile?.full_name ||
                      user?.email?.split("@")[0]}
                  </span>
                )}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                onClick={() => setAuthModalOpen(true)}
                tooltip="Sign Up"
                className={isCollapsedView ? "justify-center" : ""}
              >
                <UserCircle className="w-4 h-4" />
                {!isCollapsedView && <span className="text-sm">Sign Up</span>}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};