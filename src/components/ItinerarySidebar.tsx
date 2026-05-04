import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Check, X, Heart,
  Pin, Home, FileText, UserCircle, CalendarCheck, MoreHorizontal, ChevronLeft, ChevronRight, SquarePen, Search, Disc,
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

const BrandLogo = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-[12px] bg-foreground flex items-center justify-center shrink-0"
    style={{ width: size, height: size }}
    aria-label="swam"
  >
    <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none">
      <circle cx="12" cy="12" r="9" stroke="hsl(var(--background))" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.2" fill="hsl(var(--background))" />
    </svg>
  </div>
);

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

  const { isAuthenticated } = useAuth();
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
    if (!isAuthenticated) { setAuthModalOpen(true); return; }
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

  const navItems = [
    { to: "/", icon: Home, label: "Home", active: location.pathname === "/" },
    { to: "/travellers", icon: UserCircle, label: "Travellers", active: location.pathname === "/travellers" },
    { to: "/feed", icon: CalendarCheck, label: "Feed", active: location.pathname === "/feed" },
    { to: "/liked", icon: Heart, label: "Liked", active: location.pathname === "/liked" },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-sidebar"
    >
      {/* Floating circular toggle on the outer right edge — matches screenshot */}
      <button
        onClick={toggleSidebar}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden md:flex absolute top-7 -right-4 z-30 w-8 h-8 rounded-full bg-background border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-md transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <SidebarContent className="bg-sidebar">
        {/* Brand row — logo only, matches screenshot */}
        <div className={cn("pt-5", collapsed ? "px-0 flex justify-center" : "px-4")}>
          <Link to="/" aria-label="swam.app" className="inline-flex items-center group">
            <BrandLogo size={40} />
          </Link>
        </div>

        {/* Primary nav */}
        <div className={cn("pt-8", collapsed ? "px-0" : "px-3")}>
          <div className="space-y-1">
            {navItems.map((n) => collapsed ? (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                className={cn(
                  "w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-colors",
                  n.active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <n.icon className="w-5 h-5" strokeWidth={1.75} />
              </Link>
            ) : (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 h-11 px-3 rounded-xl text-[14px] transition-colors",
                  n.active
                    ? "bg-muted text-foreground font-semibold"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted/60 font-medium"
                )}
              >
                <n.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Itineraries section header */}
        {!collapsed && (
          <div className="px-3 pt-5">
            <div className="flex items-center justify-between px-3 h-6 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Itineraries</span>
              <button
                onClick={() => { setNewItineraryName(""); setIsCreating(true); }}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="New itinerary"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {itineraries.length > 8 && (
              <>
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="hidden"
                  aria-hidden
                />
                {searchOpen && (
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Search trips"
                      autoFocus
                      className="h-9 pl-9 text-[13px] rounded-lg bg-foreground/[0.07] border-0"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          {!collapsed && (
            <SidebarGroup className="pt-0 pb-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
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
                              "group/item h-8 rounded-lg text-[13px] font-normal text-foreground/70 hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground mx-1",
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
                    <p className="text-[12px] text-muted-foreground px-4 py-2">
                      {filter ? "No matches" : "No trips yet"}
                    </p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

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
