import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Check, X, Compass, Heart,
  Pin, User, Home, Globe, Search, SquarePen, MoreHorizontal,
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
      className="border-r border-border/40 bg-background"
    >
      <SidebarContent className="bg-background">
        {/* Spacer for the floating sidebar trigger */}
        <div className="h-12" aria-hidden="true" />

        {collapsed ? (
          <>
            {/* Brand mark only */}
            <div className="px-0 flex flex-col items-center gap-2">
              <Link
                to="/"
                title="Swam"
                className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center"
              >
                <Compass className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <button
                onClick={() => { setNewItineraryName(""); setIsCreating(true); }}
                className="w-9 h-9 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground"
                title="New itinerary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Brand row — Swam logo + name */}
            <Link
              to="/"
              className="mx-2 flex items-center gap-2.5 px-2 h-9 rounded-lg hover:bg-muted text-foreground transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center shrink-0">
                <Compass className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-bold tracking-tight">Swam</span>
            </Link>

            {/* New itinerary button (proper button style) */}
            <div className="px-2 pt-2">
              <Button
                onClick={() => { setNewItineraryName(""); setIsCreating(true); }}
                className="w-full h-9 rounded-lg gap-2 text-[13px] font-semibold"
              >
                <SquarePen className="w-4 h-4" />
                New itinerary
              </Button>
            </div>

            {/* Permanent search input */}
            <div className="px-2 pt-2 pb-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search itineraries"
                  className="h-8 pl-8 text-[13px] bg-muted border-0"
                />
              </div>
            </div>
          </>
        )}

        <ScrollArea className="flex-1">
          {/* Primary nav */}
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {navItems.map(item => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.label}
                      className={cn(
                        "h-9 gap-2.5 rounded-lg text-[13.5px] font-medium text-foreground/85 hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground",
                      )}
                    >
                      <Link to={item.to}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        {<span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Itineraries list — "Chats" style */}
          {!collapsed && (
            <SidebarGroup className="pt-3 pb-1">
              <div className="px-3 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground/80">
                  Itineraries
                </p>
              </div>
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

      {/* Bottom — profile (ChatGPT-style row with name + 3-dot menu) */}
      {!collapsed && (
        <div className="mt-auto border-t border-border/40 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
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
      )}

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
