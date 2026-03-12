import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Plus, Layers, MapPin, MoreHorizontal, Trash2, Edit2, Loader2, Bell, ChevronRight, ChevronDown, Search, X, Check, Heart } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { slugify } from "@/utils/slugUtils";
import { useItineraryUpdates } from "@/hooks/useItineraryUpdates";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";

const addModeCategories = [
  { icon: catBeaches, label: "Beaches", category: "Beach" },
  { icon: catNightlife, label: "Nightlife", category: "Nightlife" },
  { icon: catNature, label: "Nature", category: "Wildlife" },
  { icon: catAdventure, label: "Adventure", category: "Adventure" },
  { icon: catFood, label: "Food", category: "Food" },
  { icon: catSafari, label: "Safari", category: "Safari" },
];

// Spotify-style itinerary card — like a playlist (mobile)
const ItineraryPlaylistCard = ({ 
  itinerary, 
  onTap, 
  onOptions 
}: { 
  itinerary: any; 
  onTap: () => void;
  onOptions: (e: React.MouseEvent) => void;
}) => {
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;
  const location = itinerary.experiences?.[0]?.location || "";
  const date = itinerary.startDate 
    ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 py-2.5 hover:bg-muted/50 active:scale-[0.98] transition-transform duration-150 text-left group"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm">
        {coverImage ? (
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {experienceCount} experience{experienceCount !== 1 ? 's' : ''}
          {date && ` · ${date}`}
        </p>
        {location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground truncate">{location}</span>
          </div>
        )}
      </div>
      <button
        onClick={onOptions}
        className="p-2 rounded-full hover:bg-muted transition-colors duration-150"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
    </button>
  );
};

// Desktop itinerary card
const DesktopItineraryCard = ({ 
  itinerary, 
  onTap, 
  onOptions 
}: { 
  itinerary: any; 
  onTap: () => void;
  onOptions: (e: React.MouseEvent) => void;
}) => {
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;
  const location = itinerary.experiences?.[0]?.location || "";

  return (
    <div onClick={onTap} className="group cursor-pointer transition-transform hover:scale-[1.02]">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <button onClick={onOptions} className="absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xl shadow-sm flex items-center gap-1">
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        {location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MyItinerariesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { itineraries, isLoading, createItinerary, deleteItinerary, renameItinerary, setActiveItinerary, addExperienceToItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [optionsItinerary, setOptionsItinerary] = useState<any>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const isMobile = useIsMobile();
  const { updates, unreadCount, markAsRead, markAllRead } = useItineraryUpdates();
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Add Experience Mode
  const [addMode, setAddMode] = useState(false);
  const [addModeItineraryId, setAddModeItineraryId] = useState<string | null>(null);
  const [addModeItineraryName, setAddModeItineraryName] = useState("");
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Auto-open create drawer from ?create=true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
    }
  }, [searchParams]);

  // Exit add mode when navigating away
  useEffect(() => {
    if (addMode && location.pathname !== '/my-itineraries') {
      setAddMode(false);
      setAddModeItineraryId(null);
    }
  }, [location.pathname, addMode]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createItinerary(newName.trim());
    setCreating(false);
    setShowCreate(false);
    // Enter add experience mode
    setAddModeItineraryId(created.id);
    setAddModeItineraryName(newName.trim());
    setNewName("");
    setAddSearchQuery("");
    setAddCategory("");
    setAddedIds(new Set());
    setAddMode(true);
  };

  const handleTap = (itinerary: any) => {
    setActiveItinerary(itinerary.id);
    navigate(`/itineraries/${itinerary.id}`);
  };

  const handleDelete = async () => {
    if (!optionsItinerary) return;
    await deleteItinerary(optionsItinerary.id);
    setOptionsItinerary(null);
  };

  const handleRename = () => {
    if (!optionsItinerary || !renameValue.trim()) return;
    renameItinerary(optionsItinerary.id, renameValue.trim());
    setRenaming(false);
    setOptionsItinerary(null);
  };

  const handleAddExperience = useCallback((exp: any) => {
    if (!addModeItineraryId) return;
    addExperienceToItinerary(addModeItineraryId, {
      id: exp.id, title: exp.title, creator: exp.creator || '',
      videoThumbnail: exp.videoThumbnail || '', category: exp.category || '',
      location: exp.location || '', price: exp.price || '',
    });
    setAddedIds(prev => new Set(prev).add(exp.id));
  }, [addModeItineraryId, addExperienceToItinerary]);

  // Filtered experiences for add mode
  const addModeExperiences = useMemo(() => {
    let exps = [...allExperiences];
    if (addCategory) {
      exps = exps.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const filterCat = addCategory.toLowerCase();
        return cat.includes(filterCat) || filterCat.includes(cat);
      });
    }
    if (addSearchQuery.trim()) {
      const q = addSearchQuery.toLowerCase();
      exps = exps.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }
    return exps;
  }, [addCategory, addSearchQuery]);

  // Count of added experiences
  const addedCount = addedIds.size;

  if (!isAuthenticated) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <Layers className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Itineraries</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Create and manage your travel itineraries</p>
          <Button onClick={() => navigate('/auth')} className="rounded-full px-8 mb-3">
            <Plus className="w-4 h-4 mr-2" />
            Create Itinerary
          </Button>
          <p className="text-xs text-muted-foreground">Sign in to get started</p>
        </div>
      </Wrapper>
    );
  }

  // ============ ADD EXPERIENCE MODE (Mobile) ============
  if (isMobile && addMode && addModeItineraryId) {
    return (
      <MobileShell hideAvatar>
        <div className="flex flex-col h-full">
          {/* Fixed header */}
          <div className="sticky top-0 z-20 bg-background border-b border-border/30">
            {/* Adding to bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
              <Plus className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-primary flex-1 truncate">
                Adding to {addModeItineraryName}
              </span>
              {addedCount > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {addedCount} added
                </span>
              )}
              <button
                onClick={() => { setAddMode(false); setAddModeItineraryId(null); }}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2.5">
              <div className="flex items-center bg-muted rounded-full px-4 py-2.5">
                <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Search experiences to add..."
                  className="flex-1 bg-transparent border-0 outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
                  style={{ fontSize: '16px' }}
                />
                {addSearchQuery && (
                  <button onClick={() => setAddSearchQuery("")} className="p-1 rounded-full shrink-0">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Category icons row */}
            <div className="px-4 pb-3">
              <div className="flex justify-between">
                {addModeCategories.map((cat) => {
                  const isActive = addCategory === cat.category;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setAddCategory(isActive ? "" : cat.category)}
                      className="flex flex-col items-center gap-1 transition-all active:scale-95"
                    >
                      <div className={cn(
                        "w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all overflow-hidden",
                        isActive ? "ring-2 ring-primary bg-primary/5" : "bg-muted"
                      )}>
                        <img src={cat.icon} alt={cat.label} className="w-9 h-9 object-contain" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Experience list */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {addModeExperiences.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-sm text-muted-foreground">No experiences found</p>
              </div>
            ) : (
              <div>
                {addModeExperiences.map((exp) => {
                  const isAdded = addedIds.has(exp.id);
                  return (
                    <div key={exp.id} className="flex items-center border-b border-border/20 last:border-b-0">
                      <div
                        onClick={() => navigate(`/experiences/${slugify(exp.title)}`)}
                        className="flex-1 flex items-center gap-3 py-3 px-4 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {exp.videoThumbnail ? (
                            <img src={exp.videoThumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{exp.title}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {[exp.location, exp.category].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAdded) {
                            handleAddExperience(exp);
                            if ('vibrate' in navigator) navigator.vibrate(10);
                          }
                        }}
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center mr-3 transition-all",
                          isAdded
                            ? "bg-primary/10"
                            : "bg-primary active:scale-90"
                        )}
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Plus className="w-4 h-4 text-primary-foreground" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </MobileShell>
    );
  }

  // ============ MOBILE VIEW ============
  if (isMobile) {
    const visibleNotifications = showAllNotifications ? updates : updates.slice(0, 3);
    return (
      <MobileShell hideAvatar>
        <div className="flex flex-col h-full">
          {/* Fixed header */}
          <div className="sticky top-0 z-10 bg-background px-4 pt-2 pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Itineraries</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{itineraries.length} itinerar{itineraries.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <button
                onClick={() => { setNewName(""); setShowCreate(true); }}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Notifications */}
            {updates.length > 0 && (
              <div className="mt-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Updates</span>
                    {unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
                  )}
                </div>
                <div className="space-y-1">
                  {visibleNotifications.map(update => (
                    <button
                      key={update.id}
                      onClick={() => {
                        markAsRead(update.itineraryId);
                        navigate(`/itineraries/${update.itineraryId}`);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                        !update.read ? "bg-primary/5" : "hover:bg-muted/40"
                      )}
                    >
                      {!update.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate", !update.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {update.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(update.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                    </button>
                  ))}
                </div>
                {updates.length > 3 && !showAllNotifications && (
                  <button 
                    onClick={() => setShowAllNotifications(true)}
                    className="w-full text-center py-2 mt-1 text-xs text-primary font-medium"
                  >
                    Show all {updates.length} updates
                  </button>
                )}
                {showAllNotifications && updates.length > 3 && (
                  <button 
                    onClick={() => setShowAllNotifications(false)}
                    className="w-full text-center py-2 mt-1 text-xs text-muted-foreground font-medium"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : itineraries.length === 0 ? (
              <div className="text-center py-16">
                <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No itineraries yet</p>
                <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Create your first
                </Button>
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {itineraries.map(itinerary => (
                  <ItineraryPlaylistCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    onTap={() => handleTap(itinerary)}
                    onOptions={(e) => {
                      e.stopPropagation();
                      setOptionsItinerary(itinerary);
                      setRenameValue(itinerary.name);
                      if ('vibrate' in navigator) navigator.vibrate(10);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create drawer */}
        <Drawer open={showCreate} onOpenChange={setShowCreate}>
          <DrawerContent className="overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold mb-4">New Itinerary</h3>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Zanzibar Weekend"
                className="h-12 rounded-xl mb-4"
                style={{ fontSize: '16px' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
              />
              <Button 
                onClick={handleCreate} 
                disabled={!newName.trim() || creating}
                className="w-full h-12 rounded-xl"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create & Add Experiences
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Options drawer */}
        <Drawer open={!!optionsItinerary && !renaming} onOpenChange={(open) => !open && setOptionsItinerary(null)}>
          <DrawerContent className="overflow-hidden">
            <div className="px-6 py-5 space-y-2">
              <h3 className="text-lg font-bold mb-3 truncate">{optionsItinerary?.name}</h3>
              <button
                onClick={() => setRenaming(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Edit2 className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Rename</span>
              </button>
              <button
                onClick={() => {
                  if (optionsItinerary) {
                    setAddModeItineraryId(optionsItinerary.id);
                    setAddModeItineraryName(optionsItinerary.name);
                    setAddSearchQuery("");
                    setAddCategory("");
                    setAddedIds(new Set());
                    setAddMode(true);
                    setOptionsItinerary(null);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Add Experiences</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Delete</span>
              </button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Rename drawer */}
        <Drawer open={renaming} onOpenChange={(open) => { if (!open) setRenaming(false); }}>
          <DrawerContent className="overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold mb-4">Rename Itinerary</h3>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-12 rounded-xl mb-4"
                style={{ fontSize: '16px' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
              />
              <Button onClick={handleRename} disabled={!renameValue.trim()} className="w-full h-12 rounded-xl">
                Save
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </MobileShell>
    );
  }

  // ============ DESKTOP VIEW ============
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Itineraries</h1>
            <p className="text-muted-foreground mt-1">{itineraries.length} itinerar{itineraries.length !== 1 ? 'ies' : 'y'}</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Itinerary
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No itineraries yet</h2>
            <p className="text-muted-foreground mb-6">Start planning your next adventure</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create your first
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {itineraries.map(itinerary => (
              <DesktopItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                onTap={() => handleTap(itinerary)}
                onOptions={(e) => {
                  e.stopPropagation();
                  setOptionsItinerary(itinerary);
                  setRenameValue(itinerary.name);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Drawer open={showCreate} onOpenChange={setShowCreate}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5 max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">New Itinerary</h3>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Zanzibar Weekend"
              className="h-12 rounded-xl mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button 
              onClick={handleCreate} 
              disabled={!newName.trim() || creating}
              className="w-full h-12 rounded-xl"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create & Add Experiences
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!optionsItinerary && !renaming} onOpenChange={(open) => !open && setOptionsItinerary(null)}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5 max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold mb-3 truncate">{optionsItinerary?.name}</h3>
            <button onClick={() => setRenaming(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <Edit2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Rename</span>
            </button>
            <button
              onClick={() => {
                if (optionsItinerary) {
                  setAddModeItineraryId(optionsItinerary.id);
                  setAddModeItineraryName(optionsItinerary.name);
                  setAddSearchQuery("");
                  setAddCategory("");
                  setAddedIds(new Set());
                  setAddMode(true);
                  setOptionsItinerary(null);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Add Experiences</span>
            </button>
            <button onClick={handleDelete} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive">
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={renaming} onOpenChange={(open) => { if (!open) setRenaming(false); }}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5 max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">Rename Itinerary</h3>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-12 rounded-xl mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <Button onClick={handleRename} disabled={!renameValue.trim()} className="w-full h-12 rounded-xl">
              Save
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </MainLayout>
  );
};

export default MyItinerariesPage;
