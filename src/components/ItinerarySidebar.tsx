import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Check, X, Compass, Heart,
  Pin, User, Home, Globe, Search, SquarePen, MoreHorizontal, PanelLeft, PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
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

export const ItinerarySidebar = ({}: ItinerarySidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
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
  const [filter, setFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCreate = () => {
    const name = newItineraryName.trim() || "New trip";
    createItinerary(name);
    setNewItineraryName("");
    setIsCreating(false);
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

  const sortedItineraries = [...itineraries]
    .filter(it => !filter.trim() || it.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

  // Primary nav (Home removed — brand row replaces it)
  const navItems = [
    { to: "/things-to-do", icon: Compass, label: "Explore", active: location.pathname.startsWith("/things-to-do") },
    { to: "/itineraries", icon: Globe, label: "Itineraries", active: location.pathname === "/itineraries" },
    { to: "/liked", icon: Heart, label: "Liked", active: location.pathname === "/liked" },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarContent className="bg-sidebar">
        {/* Brand row — toggle ALWAYS on the left, swam.app to its right (only when expanded) */}
        <div className="pt-3 px-2">
          <div className={cn("flex items-center gap-1", collapsed && "justify-center")}>
            <button
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            {!collapsed && (
              <Link
                to="/"
                className="flex-1 flex items-center px-2 h-9 rounded-lg hover:bg-muted transition-colors text-[20px] tracking-[-0.03em] text-foreground"
                style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", fontWeight: 800, letterSpacing: '-0.5px' }}
              >
                swam<span className="text-primary font-extrabold">.app</span>
              </Link>
            )}
          </div>
        </div>

        {/* New itinerary — full button when expanded, icon-only when collapsed */}
        <div className={cn("pt-2", collapsed ? "px-0 flex justify-center" : "px-2")}>
          {collapsed ? (
            <button
              onClick={() => { setNewItineraryName(""); setIsCreating(true); }}
              title="New itinerary"
              className="w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <Button
              onClick={() => { setNewItineraryName(""); setIsCreating(true); }}
              className="w-full h-9 rounded-lg text-[13px] font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New itinerary
            </Button>
          )}
        </div>

        {/* Primary nav: Home + Explore */}
        {(() => {
          const navLinks = [
            { to: "/", icon: Home, label: "Home", active: location.pathname === "/" },
            { to: "/things-to-do", icon: Compass, label: "Explore", active: location.pathname.startsWith("/things-to-do") },
          ];
          return (
            <div className={cn("pt-2 space-y-0.5", collapsed ? "px-0 flex flex-col items-center" : "px-2")}>
              {navLinks.map((n) => collapsed ? (
                <Link
                  key={n.to}
                  to={n.to}
                  title={n.label}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    n.active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <n.icon className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2.5 h-9 px-2 rounded-lg text-[13px] font-semibold transition-colors",
                    n.active ? "bg-muted text-foreground" : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </Link>
              ))}
            </div>
          );
        })()}

        {/* Itineraries section header + optional search (only if many) */}
        {!collapsed && (
          <div className="px-2 pt-4 pb-1">
            <div className="flex items-center justify-between px-2 h-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Itineraries</span>
              {itineraries.length > 8 && (
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Search itineraries"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {itineraries.length > 8 && searchOpen && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search itineraries"
                  autoFocus
                  className="h-9 pl-9 text-[13px] rounded-lg bg-foreground/[0.07] hover:bg-foreground/[0.09] focus-visible:bg-foreground/[0.09] border-0 ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/70 transition-colors"
                />
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          {/* Itineraries list — no nav, no title (search bar above already labels it) */}
          {!collapsed && (
            <SidebarGroup className="pt-2 pb-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
                  {/* Inline create removed — uses modal dialog */}

                  {sortedItineraries.map((itinerary) => {
                    const isPinned = pinnedIds.includes(itinerary.id);
                    const isActive = activeItineraryId === itinerary.id;
                    return (
                      <SidebarMenuItem key={itinerary.id}>
                        {editingId === itinerary.id ? (
                          <div className="flex items-center gap-1.5 px-2 py-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-7 text-[13px] bg-muted border-0"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(itinerary.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
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
                            isActive={isActive}
                            onClick={() => { setActiveItinerary(itinerary.id); navigate(`/trip/${itinerary.id}`); }}
                            className={cn(
                              "group/item h-8 rounded-lg text-[13px] font-normal text-foreground/80 hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground",
                            )}
                          >
                            {isPinned && <Pin className="w-3 h-3 shrink-0 text-foreground/60 rotate-45" />}
                            <span className="truncate flex-1">{itinerary.name}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <span
                                  role="button"
                                  className="opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-foreground/60 cursor-pointer ml-auto shrink-0"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" side="right" className="w-44">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(itinerary.id); }}>
                                  <Pin className={cn("w-4 h-4 mr-2", isPinned && "rotate-45")} />
                                  {isPinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingId(itinerary.id); setEditName(itinerary.name); }}>
                                  <SquarePen className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                {itineraries.length > 1 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => { e.stopPropagation(); deleteItinerary(itinerary.id); }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}

                  {sortedItineraries.length === 0 && (
                    <p className="text-[12px] text-muted-foreground px-3 py-2">
                      {filter ? "No matches" : "No itineraries yet"}
                    </p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>

      {/* Bottom — profile (always visible; collapses to avatar-only) */}
      <div className={cn("mt-auto border-t border-border/40", collapsed ? "p-2 flex justify-center" : "p-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <button
                title={userProfile?.full_name || userProfile?.username || user?.email || "Sign in"}
                className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center overflow-hidden transition-colors"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <button
                className="w-full flex items-center gap-2.5 px-2 h-11 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                    {userProfile?.full_name || userProfile?.username || user?.email?.split("@")[0] || "Sign in"}
                  </p>
                  {isAuthenticated && (
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">Free plan</p>
                  )}
                </div>
                {isAuthenticated && <MoreHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "start" : "end"} side="top" className="w-56">
            {isAuthenticated ? (
              <>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <X className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => setAuthModalOpen(true)}>
                <User className="w-4 h-4 mr-2" />
                Sign in
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* New itinerary modal */}
      <Dialog open={isCreating} onOpenChange={(o) => { if (!o) { setIsCreating(false); setNewItineraryName(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New itinerary</DialogTitle>
            <DialogDescription>Give your trip a name to get started.</DialogDescription>
          </DialogHeader>
          <Input
            value={newItineraryName}
            onChange={(e) => setNewItineraryName(e.target.value)}
            placeholder="e.g. Zanzibar in October"
            className="h-10"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setIsCreating(false); setNewItineraryName(""); }}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
};
