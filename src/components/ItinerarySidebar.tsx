import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Check, X, Compass, Heart,
  Pin, Gift, User, Home, Search, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BrowseDestination } from "@/hooks/useDestinations";

interface ItinerarySidebarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: BrowseDestination | null;
  onCitySelect?: (city: BrowseDestination | null) => void;
  onMobileSearchClick?: () => void;
}

const PINNED_KEY = "pinned_itineraries";
const getPinnedIds = (): string[] => { try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; } };
const setPinnedIds = (ids: string[]) => localStorage.setItem(PINNED_KEY, JSON.stringify(ids));

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
    itineraries, activeItineraryId, setActiveItinerary,
    createItinerary, deleteItinerary, renameItinerary,
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
    if (editName.trim()) { renameItinerary(id, editName.trim()); setEditingId(null); }
  };

  const togglePin = (id: string) => {
    const newPinned = pinnedIds.includes(id) ? pinnedIds.filter(p => p !== id) : [...pinnedIds, id];
    setPinnedIdsState(newPinned);
    setPinnedIds(newPinned);
  };

  const isCollapsedView = collapsed || isMobile;

  const sortedItineraries = [...itineraries].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border/40 bg-background transition-all duration-200",
        !collapsed && "w-[240px]"
      )}
    >
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="h-12" aria-hidden="true" />

          {/* Main nav */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/" || location.pathname === "/search"}
                    tooltip="Home"
                    className={cn(
                      "h-10 gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      (location.pathname === "/" || location.pathname === "/search") && "text-foreground"
                    )}
                  >
                    <Link to="/">
                      <Home className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Home</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith("/things-to-do")}
                    tooltip="Explore"
                    className={cn(
                      "h-10 gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname.startsWith("/things-to-do") && "text-foreground"
                    )}
                  >
                    <Link to="/things-to-do">
                      <Compass className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Explore</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/itineraries"}
                    tooltip="Itineraries"
                    className={cn(
                      "h-10 gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname === "/itineraries" && "text-foreground"
                    )}
                  >
                    <Link to="/itineraries">
                      <Globe className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Itineraries</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/liked"}
                    tooltip="Liked"
                    className={cn(
                      "h-10 gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors",
                      location.pathname === "/liked" && "text-foreground"
                    )}
                  >
                    <Link to="/liked">
                      <Heart className="w-5 h-5 shrink-0" />
                      {!isCollapsedView && <span>Liked</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!isCollapsedView && <div className="mx-3 my-1 h-px bg-border/30" />}

          {/* Your Library (itineraries) */}
          <SidebarGroup className="py-1">
            {!isCollapsedView && (
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Your Library
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {isCollapsedView ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Create Itinerary" onClick={() => setIsCreating(true)} className="justify-center">
                      <Plus className="w-5 h-5" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <>
                    {/* New itinerary input */}
                    {isCreating && (
                      <div className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={newItineraryName}
                            onChange={(e) => setNewItineraryName(e.target.value)}
                            placeholder="Trip name..."
                            className="h-8 text-xs border-border/50"
                            style={{ fontSize: "13px" }}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            autoFocus
                          />
                          <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleCreate}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setIsCreating(false)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {sortedItineraries.map((itinerary) => {
                      const isPinned = pinnedIds.includes(itinerary.id);
                      return (
                        <SidebarMenuItem key={itinerary.id}>
                          {editingId === itinerary.id ? (
                            <div className="flex items-center gap-1.5 px-2 py-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-7 text-xs"
                                style={{ fontSize: "13px" }}
                                onKeyDown={(e) => e.key === "Enter" && handleRename(itinerary.id)}
                                autoFocus
                              />
                              <Button size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRename(itinerary.id)}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingId(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <SidebarMenuButton
                              isActive={activeItineraryId === itinerary.id}
                              onClick={() => { setActiveItinerary(itinerary.id); navigate(`/trip/${itinerary.id}`); }}
                              className="group/item text-xs text-muted-foreground hover:text-foreground h-8"
                            >
                              {isPinned && <Pin className="w-3 h-3 shrink-0 text-primary rotate-45" />}
                              <span className="truncate">{itinerary.name}</span>
                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 ml-auto shrink-0">
                                <span
                                  role="button"
                                  title={isPinned ? "Unpin" : "Pin"}
                                  className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground cursor-pointer"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(itinerary.id); }}
                                >
                                  <Pin className={cn("w-3 h-3", isPinned && "text-primary rotate-45")} />
                                </span>
                                {itineraries.length > 1 && (
                                  <span
                                    role="button"
                                    title="Delete"
                                    className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent text-destructive cursor-pointer"
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
                      <p className="text-[11px] text-muted-foreground px-3 py-2">No itineraries yet</p>
                    )}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {/* Bottom — profile */}
      {!collapsed && (
        <div className="mt-auto border-t border-border/30 px-3 py-3">
          <button 
            onClick={() => isAuthenticated ? navigate("/profile") : setAuthModalOpen(true)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {userProfile?.full_name || userProfile?.username || user?.email || "Sign in"}
            </span>
          </button>
        </div>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};
