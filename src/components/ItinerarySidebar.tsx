import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Compass,
  Search,
  Heart,
  Home,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";
import { useUserLikes } from "@/hooks/useUserLikes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
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
        !collapsed && "w-60"
      )}
    >
      {/* Spotify-style top nav section */}
      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Main nav items */}
          <SidebarGroup className="py-3">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/"}
                    tooltip="Home"
                    className={cn(
                      "h-10 gap-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname === "/" && "text-foreground"
                    )}
                  >
                    <Link to="/">
                      <Home className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Home</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  {isCollapsedView ? (
                    <SidebarMenuButton
                      tooltip="Search"
                      className="h-10 gap-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground transition-colors justify-center"
                      onClick={onMobileSearchClick}
                    >
                      <Search className="w-5 h-5 shrink-0" />
                    </SidebarMenuButton>
                  ) : (
                    <div ref={searchContainerRef} className="w-full px-1 mt-1">
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

                      {/* Search dropdown */}
                      {searchFocused && (
                        <div
                          className="absolute left-2 right-2 mt-2 rounded-lg bg-popover border border-border shadow-lg overflow-hidden z-50"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="py-2 max-h-[320px] overflow-y-auto">
                            {recentSearches.length > 0 && (
                              <div className="px-3 py-2">
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Recent</p>
                                {recentSearches.map((search, i) => (
                                  <button
                                    key={i}
                                    onClick={() => { onSearchChange?.(search); setSearchFocused(false); }}
                                    className="w-full flex items-center gap-2.5 text-sm py-2 px-2 -mx-2 rounded-md hover:bg-muted transition-colors text-foreground"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="truncate">{search}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="px-3 py-2">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestedTags.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => { onSearchChange?.(tag); setSearchFocused(false); }}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="px-3 py-2">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Suggestions</p>
                              {searchSuggestions.map((suggestion, i) => (
                                <button
                                  key={i}
                                  onClick={() => { onSearchChange?.(suggestion); setSearchFocused(false); }}
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

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Liked"
                    className={cn(
                      "h-10 gap-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname === "/profile" && "text-foreground"
                    )}
                  >
                    <Link to="/profile">
                      <Heart className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Liked</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!isCollapsedView && <div className="mx-3 h-px bg-border/30" />}

          {/* Itineraries section - Spotify playlist style */}
          <SidebarGroup className={cn(
            "transition-all duration-500",
            highlightItineraries && "bg-primary/10 rounded-lg ring-2 ring-primary/30"
          )}>
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
                      <Compass className="w-5 h-5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              <Collapsible open={itinerariesOpen} onOpenChange={setItinerariesOpen}>
                <div className="flex items-center justify-between pr-2">
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "flex items-center gap-1 text-muted-foreground uppercase text-xs tracking-wider hover:text-foreground transition-colors p-2",
                      highlightItineraries && "text-primary font-semibold"
                    )}>
                      {itinerariesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      My Itineraries
                    </button>
                  </CollapsibleTrigger>
                  {showPlusButton && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreating(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <CollapsibleContent>
                  <SidebarGroupContent>
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
                          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleCreate}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setIsCreating(false)}>
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
                                onKeyDown={(e) => e.key === "Enter" && handleRename(itinerary.id)}
                                autoFocus
                              />
                              <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRename(itinerary.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <SidebarMenuButton
                              isActive={activeItineraryId === itinerary.id}
                              onClick={() => { setActiveItinerary(itinerary.id); navigate(`/trip/${itinerary.id}`); }}
                              className="group/item text-sm text-muted-foreground hover:text-foreground"
                            >
                              <span className="truncate">{itinerary.name}</span>
                              {!isCollapsedView && itineraries.length > 1 && (
                                <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 ml-auto">
                                  <span
                                    role="button"
                                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-destructive hover:text-destructive cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); deleteItinerary(itinerary.id); }}
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

          {/* Create Itinerary button */}
          {!isCollapsedView && (
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 h-9 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" />
                Create Itinerary
              </Button>
            </div>
          )}

          {!isCollapsedView && <div className="mx-3 h-px bg-border/30" />}

          {/* Liked section */}
          <LikedSection isCollapsedView={isCollapsedView} navigate={navigate} />

        </ScrollArea>
      </SidebarContent>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};

// Liked section component
const LikedSection = ({ isCollapsedView, navigate }: { isCollapsedView: boolean; navigate: (path: string) => void }) => {
  const { likes } = useUserLikes();
  const [likesOpen, setLikesOpen] = useState(true);
  
  const likedExperiences = likes.filter(l => l.item_type === 'experience');
  const likedItineraries = likes.filter(l => l.item_type === 'itinerary');

  if (isCollapsedView) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Liked" onClick={() => navigate("/profile")} className="justify-center">
                <Heart className="w-5 h-5" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible open={likesOpen} onOpenChange={setLikesOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-muted-foreground uppercase text-xs tracking-wider hover:text-foreground transition-colors p-2">
            {likesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Liked
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarGroupContent>
            {/* Liked Itineraries */}
            {likedItineraries.length > 0 && (
              <div className="px-2 mb-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                  Itineraries
                </p>
                <SidebarMenu>
                  {likedItineraries.slice(0, 5).map((like) => (
                    <SidebarMenuItem key={like.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(`/itinerary/${like.item_id}`)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Compass className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{like.item_data?.name || 'Itinerary'}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            {/* Liked Experiences */}
            {likedExperiences.length > 0 && (
              <div className="px-2 mb-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                  Experiences
                </p>
                <SidebarMenu>
                  {likedExperiences.slice(0, 5).map((like) => (
                    <SidebarMenuItem key={like.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(`/experience/${like.item_id}`)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{like.item_data?.title || 'Experience'}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            {likes.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2">No likes yet</p>
            )}

            {likes.length > 5 && (
              <div className="px-2 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/profile")}
                >
                  See all likes →
                </Button>
              </div>
            )}
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};