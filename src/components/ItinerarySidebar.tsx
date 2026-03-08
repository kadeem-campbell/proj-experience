import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Check,
  X,
  Compass,
  Heart,
  
  Sparkles,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { City } from "@/data/browseData";

interface ItinerarySidebarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
  onMobileSearchClick?: () => void;
}

const PINNED_KEY = "pinned_itineraries";

const getPinnedIds = (): string[] => {
  try {
    const stored = localStorage.getItem(PINNED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const setPinnedIds = (ids: string[]) => {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
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

  const {
    itineraries,
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
  const [pinnedIds, setPinnedIdsState] = useState<string[]>(getPinnedIds());

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

  const togglePin = (id: string) => {
    const newPinned = pinnedIds.includes(id)
      ? pinnedIds.filter(p => p !== id)
      : [...pinnedIds, id];
    setPinnedIdsState(newPinned);
    setPinnedIds(newPinned);
  };

  const isCollapsedView = collapsed || isMobile;

  // Sort: pinned first, then by most recent (created_at desc)
  const sortedItineraries = [...itineraries].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    // Most recent first
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/50 bg-card transition-all duration-200",
        !collapsed && "w-60"
      )}
    >
      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Collapse/Expand toggle */}
          <div className="px-2 py-2 flex items-center justify-center">
            <SidebarTrigger className="h-8 w-8" />
          </div>

          {/* Nav items below toggle */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Discover */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/experiences"}
                    tooltip="Discover"
                    className={cn(
                      "h-10 gap-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname === "/experiences" && "text-foreground"
                    )}
                  >
                    <Link to="/experiences">
                      <Compass className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Discover</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Liked */}
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

          {/* Create Itinerary */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {isCollapsedView ? (
                    <SidebarMenuButton
                      tooltip="Create Itinerary"
                      onClick={() => setIsCreating(true)}
                      className="justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      onClick={() => setIsCreating(true)}
                      className="h-10 gap-4 text-[15px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-5 h-5 shrink-0" />
                      <span>Create Itinerary</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* New itinerary input */}
          {isCreating && !isCollapsedView && (
            <div className="px-3 py-2">
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

          {!isCollapsedView && <div className="mx-3 h-px bg-border/30" />}

          {/* My Itineraries - always visible, not collapsible (ChatGPT-style) */}
          <SidebarGroup className="py-1">
            {!isCollapsedView && (
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                My Itineraries
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {isCollapsedView ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="My Itineraries"
                      onClick={() => navigate("/itineraries")}
                      className="justify-center"
                    >
                      <Compass className="w-5 h-5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <>
                    {sortedItineraries.map((itinerary) => {
                      const isPinned = pinnedIds.includes(itinerary.id);
                      return (
                        <SidebarMenuItem key={itinerary.id}>
                          {editingId === itinerary.id ? (
                            <div className="flex items-center gap-2 px-2 py-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 text-sm"
                                style={{ fontSize: "14px" }}
                                onKeyDown={(e) => e.key === "Enter" && handleRename(itinerary.id)}
                                autoFocus
                              />
                              <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRename(itinerary.id)}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <SidebarMenuButton
                              isActive={activeItineraryId === itinerary.id}
                              onClick={() => { setActiveItinerary(itinerary.id); navigate(`/trip/${itinerary.id}`); }}
                              className="group/item text-sm text-muted-foreground hover:text-foreground"
                            >
                              {isPinned && (
                                <Pin className="w-3 h-3 shrink-0 text-primary rotate-45" />
                              )}
                              <span className="truncate">{itinerary.name}</span>
                              
                              {/* Hover actions */}
                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 ml-auto shrink-0">
                                <span
                                  role="button"
                                  title={isPinned ? "Unpin" : "Pin to top"}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); togglePin(itinerary.id); }}
                                >
                                  <Pin className={cn("w-3 h-3", isPinned && "text-primary rotate-45")} />
                                </span>
                                {itineraries.length > 1 && (
                                  <span
                                    role="button"
                                    title="Delete"
                                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-destructive hover:text-destructive cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); deleteItinerary(itinerary.id); }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                    {itineraries.length === 0 && (
                      <p className="text-xs text-muted-foreground px-3 py-2">No itineraries yet</p>
                    )}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};
