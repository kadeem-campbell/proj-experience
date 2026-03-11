import { useParams, Link, useNavigate } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { useState, useMemo, useCallback, useEffect } from "react";
import { allExperiences } from "@/hooks/useExperiencesData";

import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays } from "date-fns";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { useItineraryUpdates } from "@/hooks/useItineraryUpdates";
import { publicItinerariesData } from "@/data/itinerariesData";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Search,
  Check,
  Plus,
  MoreHorizontal,
  ListPlus,
  MessageCircle,
  Rocket,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Globe,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Send,
  Mail,
  List,
  Grid3X3,
  Route,
  AlertTriangle,
  ExternalLink,
  Download,
  ArrowUpDown,
  MoveVertical,
} from "lucide-react";

// Time slot configurations
const timeSlotConfig: Record<TimeSlot, { label: string; icon: React.ReactNode }> = {
  morning: { label: "Morning", icon: <Sunrise className="w-3 h-3" /> },
  afternoon: { label: "Afternoon", icon: <Sun className="w-3 h-3" /> },
  evening: { label: "Evening", icon: <Sunset className="w-3 h-3" /> },
  night: { label: "Night", icon: <Moon className="w-3 h-3" /> },
};

type ViewMode = 'list' | 'icons' | 'trips';

const PublicItinerary = () => {
  const { slug: id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('local_likes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Add to itinerary flow
  const [showAddToItinerarySheet, setShowAddToItinerarySheet] = useState(false);
  const [addItinerarySearch, setAddItinerarySearch] = useState("");
  const [newItineraryName, setNewItineraryName] = useState("");
  const [showNewItineraryInput, setShowNewItineraryInput] = useState(false);
  const [goToAction, setGoToAction] = useState<{ name: string; id: string } | null>(null);
  
  // Share sheet
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showCollaboratorSheet, setShowCollaboratorSheet] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  
  // Trip creation (owned itinerary)
  const [showCreateTripSheet, setShowCreateTripSheet] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<Record<string, LikedExperience[]>>({});
  const [activeTripMode, setActiveTripMode] = useState(false);
  const [dragWarnings, setDragWarnings] = useState<Map<string, string>>(new Map());
  const [movingExp, setMovingExp] = useState<{ id: string; fromDay: string } | null>(null);
  
  // Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { 
    addExperienceToItinerary, 
    createItinerary, 
    itineraries, 
    copyItinerary,
    createTrip,
    isLoading: itinerariesLoading,
  } = useItineraries();
  const { isAuthenticated } = useAuth();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { addUpdate } = useItineraryUpdates();

  // Like helpers
  const isItemLiked = useCallback((itemId: string, itemType: 'experience' | 'itinerary' = 'experience') => {
    if (isAuthenticated) return isDbLiked(itemId, itemType);
    return localLikes.has(`${itemType}:${itemId}`);
  }, [isAuthenticated, isDbLiked, localLikes]);

  const handleToggleLike = useCallback(async (itemId: string, itemType: 'experience' | 'itinerary', itemData: Record<string, any>) => {
    if (isAuthenticated) {
      await toggleDbLike(itemId, itemType, itemData);
    } else {
      setLocalLikes(prev => {
        const key = `${itemType}:${itemId}`;
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        localStorage.setItem('local_likes', JSON.stringify([...next]));
        return next;
      });
    }
  }, [isAuthenticated, toggleDbLike]);

  // Find itinerary - check public data first, then user's own
  const publicItinerary = publicItinerariesData.find(i => i.id === id);
  const ownedItinerary = itineraries.find(i => i.id === id);
  const itinerary = publicItinerary || ownedItinerary;
  const isOwned = !!ownedItinerary && !publicItinerary;

  const itineraryLocation = useMemo(() => {
    if (!itinerary) return '';
    const locations = itinerary.experiences.map(e => e.location).filter(Boolean);
    const freq: Record<string, number> = {};
    locations.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [itinerary]);

  // Filter experiences
  const filteredExperiences = useMemo(() => {
    if (!itinerary) return [];
    const exps = itinerary.experiences;
    if (!searchQuery.trim()) return exps;
    const q = searchQuery.toLowerCase();
    return exps.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    );
  }, [itinerary, searchQuery]);

  // Filtered itineraries for add-to-itinerary search
  const filteredItineraries = useMemo(() => {
    if (!addItinerarySearch.trim()) return itineraries;
    const q = addItinerarySearch.toLowerCase();
    return itineraries.filter(i => i.name.toLowerCase().includes(q));
  }, [itineraries, addItinerarySearch]);

  // --- Preset public trip examples ---
  const publicTripExamples = useMemo(() => {
    if (isOwned || !itinerary) return [];
    const exps = itinerary.experiences;
    const perDay = Math.ceil(exps.length / 3);
    return [
      { label: "Day 1", experiences: exps.slice(0, perDay) },
      { label: "Day 2", experiences: exps.slice(perDay, perDay * 2) },
      { label: "Day 3", experiences: exps.slice(perDay * 2) },
    ].filter(d => d.experiences.length > 0);
  }, [isOwned, itinerary]);

  // Loading / not found states
  if (!itinerary && itinerariesLoading) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideTopBar: true } : {})}>
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Wrapper>
    );
  }

  if (!itinerary) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideTopBar: true } : {})}>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Itinerary Not Found</h1>
          <p className="text-muted-foreground mb-6">This itinerary doesn't exist or has been removed.</p>
          <Link to="/experiences">
            <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Experiences</Button>
          </Link>
        </div>
      </Wrapper>
    );
  }

  // --- Share Handlers ---
  const handleCopyLink = async () => {
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    const shareUrl = `${baseUrl}/itineraries/${itinerary.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    const shareUrl = `${baseUrl}/itineraries/${itinerary.id}`;
    const text = `Check out this itinerary: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExportCSV = () => {
    const rows = itinerary.experiences.map(exp => ({
      name: exp.title || '', location: exp.location || '', category: exp.category || '',
      timeSlot: exp.timeSlot || '', notes: exp.notes || '',
    }));
    const headers = ['Name', 'Location', 'Category', 'Time Slot', 'Notes'];
    const csv = [headers.join(','), ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${itinerary.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    const rows = itinerary.experiences.map(exp => ({
      name: exp.title || '', location: exp.location || '', category: exp.category || '',
      timeSlot: exp.timeSlot || '', notes: exp.notes || '',
    }));
    const headers = ['Name', 'Location', 'Category', 'Time Slot', 'Notes'];
    const tsv = [headers.join('\t'), ...rows.map(r => Object.values(r).map(v => String(v)).join('\t'))].join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${itinerary.name}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Add to Itinerary Handlers ---
  const handleAddToNewItinerary = async () => {
    if (!newItineraryName.trim()) return;
    const name = newItineraryName.trim();
    // Copy all experiences from this public itinerary
    const newIt = await createItinerary(name, itinerary.experiences.map(e => ({ ...e, likedAt: new Date().toISOString() })));
    addUpdate({
      type: 'created',
      message: `New itinerary created: ${name}`,
      itineraryId: newIt.id,
      itineraryName: name,
    });
    setNewItineraryName("");
    setShowNewItineraryInput(false);
    setShowAddToItinerarySheet(false);
    setGoToAction({ name, id: newIt.id });
    setTimeout(() => setGoToAction(null), 8000);
  };

  const handleAddToExistingItinerary = (targetItinerary: Itinerary) => {
    // Add all experiences from this public itinerary into the existing one
    let addedCount = 0;
    for (const exp of itinerary.experiences) {
      const result = addExperienceToItinerary(targetItinerary.id, {
        id: exp.id, title: exp.title, creator: exp.creator,
        videoThumbnail: exp.videoThumbnail, category: exp.category,
        location: exp.location, price: exp.price, timeSlot: exp.timeSlot,
      });
      if (result.success) addedCount++;
    }
    addUpdate({
      type: 'added_experiences',
      message: `Added ${addedCount} experience${addedCount !== 1 ? 's' : ''} to ${targetItinerary.name}`,
      itineraryId: targetItinerary.id,
      itineraryName: targetItinerary.name,
    });
    setShowAddToItinerarySheet(false);
    setGoToAction({ name: targetItinerary.name, id: targetItinerary.id });
    setTimeout(() => setGoToAction(null), 8000);
  };

  // --- Trip Generation (Owned) ---
  const generateTrip = (startDate: Date, endDate?: Date) => {
    setIsGenerating(true);
    const bySlot: Record<TimeSlot, LikedExperience[]> = { morning: [], afternoon: [], evening: [], night: [] };
    itinerary.experiences.forEach(exp => {
      const slot = exp.timeSlot || 'afternoon';
      bySlot[slot].push({ ...exp });
    });
    const totalExperiences = itinerary.experiences.length;
    const experiencesPerDay = 4;
    const numDays = endDate
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : Math.max(1, Math.ceil(totalExperiences / experiencesPerDay));
    const tripDays: Record<string, LikedExperience[]> = {};
    for (let day = 0; day < numDays; day++) {
      const dayKey = format(addDays(startDate, day), "yyyy-MM-dd");
      tripDays[dayKey] = [];
      const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
      for (const slot of slots) {
        if (bySlot[slot].length > 0 && tripDays[dayKey].length < experiencesPerDay) {
          const exp = bySlot[slot].shift()!;
          tripDays[dayKey].push({ ...exp, timeSlot: slot });
        }
      }
      for (const slot of slots) {
        while (bySlot[slot].length > 0 && tripDays[dayKey].length < experiencesPerDay) {
          const exp = bySlot[slot].shift()!;
          tripDays[dayKey].push({ ...exp, timeSlot: slot });
        }
      }
    }
    // Remaining to last day
    const lastDayKey = format(addDays(startDate, numDays - 1), "yyyy-MM-dd");
    const allSlots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const slot of allSlots) {
      while (bySlot[slot].length > 0) {
        tripDays[lastDayKey].push(bySlot[slot].shift()!);
      }
    }
    setTimeout(() => {
      setGeneratedTrip(tripDays);
      setIsGenerating(false);
      setActiveTripMode(true);
      setShowCreateTripSheet(false);
      addUpdate({
        type: 'trip_created',
        message: `Trip created from ${itinerary.name}`,
        itineraryId: itinerary.id,
        itineraryName: itinerary.name,
      });
    }, 500);
  };

  // Validate experience placement
  const validatePlacement = (exp: LikedExperience, dayKey: string, targetSlot: TimeSlot): string | null => {
    const originalSlot = exp.timeSlot || 'afternoon';
    if (originalSlot !== targetSlot) {
      const slotLabel = timeSlotConfig[originalSlot].label;
      return `Best suited for ${slotLabel}`;
    }
    return null;
  };

  // Move experience between days in trip mode
  const handleMoveExperience = (expId: string, fromDay: string, toDay: string) => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      const exp = updated[fromDay]?.find(e => e.id === expId);
      if (!exp) return prev;
      updated[fromDay] = updated[fromDay].filter(e => e.id !== expId);
      if (!updated[toDay]) updated[toDay] = [];
      updated[toDay].push(exp);
      const warning = validatePlacement(exp, toDay, exp.timeSlot || 'afternoon');
      if (warning) {
        setDragWarnings(prev => new Map(prev).set(expId, warning));
      }
      return updated;
    });
  };

  // Reorder experience within a day
  const handleReorderInDay = (dayKey: string, expId: string, direction: 'up' | 'down') => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      const dayExps = [...(updated[dayKey] || [])];
      const idx = dayExps.findIndex(e => e.id === expId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= dayExps.length) return prev;
      [dayExps[idx], dayExps[targetIdx]] = [dayExps[targetIdx], dayExps[idx]];
      updated[dayKey] = dayExps;
      return updated;
    });
  };

  // State for move-to-day dropdown
  const [movingExp, setMovingExp] = useState<{ id: string; fromDay: string } | null>(null);

  // --- Render functions ---

  // Clean list row (Requirement #1)
  const renderListRow = (experience: LikedExperience) => {
    const liked = isItemLiked(experience.id, 'experience');
    const slotInfo = experience.timeSlot ? timeSlotConfig[experience.timeSlot] : null;
    const price = experience.price ? `$${experience.price} avg` : null;
    const warning = dragWarnings.get(experience.id);

    // Build metadata line: Location · Category · [time icon] · $49 avg
    const metaParts: string[] = [];
    if (experience.location) metaParts.push(experience.location);
    if (experience.category) metaParts.push(experience.category);

    return (
      <button
        key={experience.id}
        onClick={() => navigate(`/experiences/${slugify(experience.title)}`)}
        className="w-full flex items-center gap-3 py-3 px-4 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left border-b border-border/30 last:border-b-0"
      >
        {/* Thumbnail - clean, no overlay */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
          {experience.videoThumbnail ? (
            <img src={experience.videoThumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-muted-foreground/40" />
            </div>
          )}
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{experience.title}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground truncate">
            <span>{metaParts.join(' · ')}</span>
            {slotInfo && (
              <>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center">{slotInfo.icon}</span>
              </>
            )}
            {price && (
              <>
                <span className="opacity-40">·</span>
                <span>{price}</span>
              </>
            )}
          </div>
          {warning && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-600">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{warning}</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async (e) => {
              e.preventDefault(); e.stopPropagation();
              if ('vibrate' in navigator) navigator.vibrate(10);
              await handleToggleLike(experience.id, 'experience', {
                id: experience.id, title: experience.title, videoThumbnail: experience.videoThumbnail,
              });
            }}
            className="p-1"
          >
            <Heart className={cn("w-4 h-4 transition-all", liked ? "fill-primary text-primary" : "text-muted-foreground/30")} />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
        </div>
      </button>
    );
  };

  // Icons view card
  const renderIconCard = (experience: LikedExperience) => {
    const liked = isItemLiked(experience.id, 'experience');
    return (
      <div
        key={experience.id}
        className="cursor-pointer group"
        onClick={() => navigate(`/experiences/${slugify(experience.title)}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          {experience.videoThumbnail ? (
            <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={async (e) => {
              e.preventDefault(); e.stopPropagation();
              if ('vibrate' in navigator) navigator.vibrate(10);
              await handleToggleLike(experience.id, 'experience', { id: experience.id, title: experience.title });
            }}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-colors",
              liked ? "bg-black/40" : "bg-background/70"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", liked ? "fill-primary text-primary" : "text-muted-foreground/40")} />
          </button>
        </div>
        <div className="mt-2 space-y-0.5">
          <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{experience.location}</p>
        </div>
      </div>
    );
  };

  // Trips view - day-separated
  const renderTripsView = () => {
    if (!isOwned) {
      // Public: show 3 preset examples
      return (
        <div className="space-y-6 px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">Example trip layouts for this itinerary</p>
          {publicTripExamples.map((day, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{day.label}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {day.experiences.length} {day.experiences.length === 1 ? 'activity' : 'activities'}
                </Badge>
              </div>
              <div className="space-y-0">
                {day.experiences.map(renderListRow)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Owned: show actual trips or generated trip
    if (activeTripMode && Object.keys(generatedTrip).length > 0) {
      return (
        <div className="space-y-6 px-4 py-4">
          {Object.entries(generatedTrip)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dayKey, dayExps]) => (
              <div key={dayKey}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {format(new Date(dayKey), "EEEE, MMM d")}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {dayExps.length} {dayExps.length === 1 ? 'activity' : 'activities'}
                  </Badge>
                </div>
                <div className="space-y-0">
                  {dayExps.map(renderListRow)}
                </div>
              </div>
            ))}
        </div>
      );
    }

    // Owned but no trip yet
    const ownedTrips = ownedItinerary?.trips || [];
    if (ownedTrips.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <Route className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No trips created yet</p>
          <Button onClick={() => setShowCreateTripSheet(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create trip
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6 px-4 py-4">
        {ownedTrips.map((trip, idx) => {
          // Group experiences by date
          const dayMap: Record<string, LikedExperience[]> = {};
          (trip.experiences || []).forEach(exp => {
            const dayKey = exp.scheduledTime ? format(new Date(exp.scheduledTime), "yyyy-MM-dd") : trip.startDate;
            if (!dayMap[dayKey]) dayMap[dayKey] = [];
            dayMap[dayKey].push(exp);
          });
          return (
            <div key={trip.id || idx}>
              <h3 className="text-base font-bold text-foreground mb-3">{trip.name || `Trip ${idx + 1}`}</h3>
              {Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, exps]) => (
                <div key={dayKey} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{format(new Date(dayKey), "EEEE, MMM d")}</span>
                  </div>
                  <div className="space-y-0">{exps.map(renderListRow)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const Wrapper = isMobile ? MobileShell : MainLayout;
  const wrapperProps = isMobile ? { hideTopBar: true } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex flex-col">
        {/* Hero Cover Image */}
        <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[440px] overflow-hidden">
          {itinerary.coverImage ? (
            <img src={itinerary.coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
              <span className="text-5xl">🗺️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

          {/* Top buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button 
              onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/itineraries')}
              className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              {/* Share button */}
              <button 
                onClick={() => setShowShareSheet(true)}
                className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
              {/* Like */}
              <button 
                onClick={() => handleToggleLike(itinerary.id, 'itinerary', { id: itinerary.id, name: itinerary.name })}
                className={cn(
                  "w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg",
                  isItemLiked(itinerary.id, 'itinerary') && "bg-primary/15"
                )}
              >
                <Heart className={cn("w-5 h-5", isItemLiked(itinerary.id, 'itinerary') ? "fill-primary text-primary" : "text-foreground")} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 lg:px-8 pb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 line-clamp-2 text-foreground drop-shadow-sm">
              {itinerary.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[15px]">
              <span className="font-medium">{itinerary.experiences.length} experiences</span>
              {itineraryLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-foreground font-semibold">{itineraryLocation}</span>
                </span>
              )}
              {itinerary.creatorName && (
                <span>by <span className="text-foreground font-semibold">@{itinerary.creatorName}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Search + View Switcher + CTA */}
          <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            {/* Search bar */}
            <div className="flex items-center bg-muted rounded-full px-3 py-2 mb-3">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this itinerary"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
              />
            </div>

            {/* Unified action bar: view switcher + CTA */}
            <div className="flex items-center gap-2">
              {/* View mode switcher */}
              <div className="flex items-center bg-muted rounded-lg p-0.5 flex-1">
                {([
                  { mode: 'list' as ViewMode, icon: List, label: 'List' },
                  { mode: 'icons' as ViewMode, icon: Grid3X3, label: 'Icons' },
                  { mode: 'trips' as ViewMode, icon: Route, label: 'Trips' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all",
                      viewMode === mode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Primary CTA - matches switcher height */}
              {isOwned ? (
                <Button size="sm" className="gap-1.5 h-[34px] rounded-lg shrink-0" onClick={() => setShowCreateTripSheet(true)}>
                  <Rocket className="w-3.5 h-3.5" />
                  Create trip
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5 h-[34px] rounded-lg shrink-0" onClick={() => {
                  if (!isAuthenticated) { setShowAuthModal(true); return; }
                  setShowAddToItinerarySheet(true);
                }}>
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Go-to action banner */}
          {goToAction && (
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/10">
              <button
                onClick={() => {
                  navigate(`/itineraries/${goToAction.id}`);
                  setGoToAction(null);
                }}
                className="flex items-center gap-2 text-sm text-primary font-medium w-full"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Go to {goToAction.name}
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            </div>
          )}

          {/* Content by view mode */}
          <div className="pb-4">
            {viewMode === 'list' && (
              <div>
                {filteredExperiences.map(renderListRow)}
                {filteredExperiences.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No experiences match "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
                  </div>
                )}
              </div>
            )}
            {viewMode === 'icons' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
                {filteredExperiences.map(renderIconCard)}
              </div>
            )}
            {viewMode === 'trips' && renderTripsView()}
          </div>
        </div>
      </div>

      {/* === SHEETS === */}

      {/* Share Sheet - full-width bottom sheet */}
      <Sheet open={showShareSheet} onOpenChange={setShowShareSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-3">
            <SheetTitle>Share</SheetTitle>
            <SheetDescription>Share this itinerary with others</SheetDescription>
          </SheetHeader>
          <div className="space-y-1 pb-4">
            <button onClick={() => { handleCopyLink(); setShowShareSheet(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Copy className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">{copied ? "Copied!" : "Copy link"}</span>
            </button>
            <button onClick={() => { handleShareWhatsApp(); setShowShareSheet(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><MessageCircle className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">Share via WhatsApp</span>
            </button>
            <button onClick={() => { setShowShareSheet(false); setShowInviteSheet(true); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Send className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">Invite friends</span>
            </button>
            <button onClick={() => { setShowShareSheet(false); setShowCollaboratorSheet(true); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">Add collaborators</span>
            </button>
            <div className="h-px bg-border/50 mx-3 my-1" />
            <button onClick={() => { handleExportCSV(); setShowShareSheet(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Download className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">Export as CSV</span>
            </button>
            <button onClick={() => { handleExportXLSX(); setShowShareSheet(false); }} className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Download className="w-4.5 h-4.5 text-foreground" /></div>
              <span className="font-medium text-sm">Export as XLSX</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add to Itinerary Sheet - Spotify-style */}
      <Sheet open={showAddToItinerarySheet} onOpenChange={setShowAddToItinerarySheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] overflow-hidden flex flex-col">
          <SheetHeader className="pb-2 shrink-0">
            <SheetTitle>Add to itinerary</SheetTitle>
            <SheetDescription>Save this itinerary to your collection</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* New itinerary option */}
            {showNewItineraryInput ? (
              <div className="flex gap-2 p-3 border-b border-border/30">
                <Input
                  value={newItineraryName}
                  onChange={(e) => setNewItineraryName(e.target.value)}
                  placeholder="Itinerary name..."
                  className="h-11 flex-1"
                  style={{ fontSize: '16px' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddToNewItinerary()}
                />
                <Button className="h-11 px-5" onClick={handleAddToNewItinerary} disabled={!newItineraryName.trim()}>
                  Create
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setShowNewItineraryInput(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewItineraryInput(true)}
                className="w-full flex items-center gap-3 p-4 border-b border-border/30 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-sm text-primary">New itinerary</span>
              </button>
            )}

            {/* Search */}
            <div className="px-4 py-2">
              <div className="flex items-center bg-muted rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <Input
                  type="text"
                  value={addItinerarySearch}
                  onChange={(e) => setAddItinerarySearch(e.target.value)}
                  placeholder="Search your itineraries..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Itinerary list */}
            <div className="px-2">
              {filteredItineraries.length > 0 ? (
                filteredItineraries.map(itin => {
                  const coverImg = itin.coverImage || itin.experiences?.[0]?.videoThumbnail;
                  return (
                    <button
                      key={itin.id}
                      onClick={() => handleAddToExistingItinerary(itin)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {coverImg ? (
                          <img src={coverImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <ListPlus className="w-4 h-4 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{itin.name}</p>
                        <p className="text-xs text-muted-foreground">{itin.experiences.length} experiences</p>
                      </div>
                      <span className="text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10">Add</span>
                    </button>
                  );
                })
              ) : addItinerarySearch.trim() ? (
                <div className="py-6 px-4 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No itineraries match "<span className="font-medium text-foreground">{addItinerarySearch}</span>"
                  </p>
                  {/* Suggested quick-adds from all itineraries */}
                  {itineraries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Suggested</p>
                      {itineraries.slice(0, 3).map(itin => (
                        <button
                          key={itin.id}
                          onClick={() => handleAddToExistingItinerary(itin)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors text-left"
                        >
                          <span className="text-sm font-medium truncate">{itin.name}</span>
                          <span className="text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10 shrink-0 ml-2">Add</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No itineraries yet. Create one above!</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Trip Sheet (owned itinerary only) */}
      <Sheet open={showCreateTripSheet} onOpenChange={setShowCreateTripSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-3">
            <SheetTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Create trip
            </SheetTitle>
            <SheetDescription>
              Select your travel dates to turn this itinerary into a trip.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center py-3 w-full">
            <div className="w-full overflow-x-auto flex justify-center pb-2">
              <Calendar
                mode="range"
                selected={{ from: tripStartDate, to: tripEndDate }}
                onSelect={(range) => {
                  setTripStartDate(range?.from);
                  setTripEndDate(range?.to);
                }}
                disabled={(date) => date < new Date()}
                className="p-3 pointer-events-auto"
                numberOfMonths={1}
              />
            </div>
            {tripStartDate && tripEndDate && (
              <p className="text-sm text-center text-muted-foreground mb-3">
                {format(tripStartDate, "MMM d")} – {format(tripEndDate, "MMM d, yyyy")}
              </p>
            )}
            {tripStartDate && !tripEndDate && (
              <p className="text-sm text-center text-muted-foreground mb-3">Select an end date</p>
            )}
            <Button
              className="w-full gap-2 h-12"
              disabled={!tripStartDate || isGenerating}
              onClick={() => {
                if (tripStartDate) {
                  setViewMode('trips');
                  generateTrip(tripStartDate, tripEndDate || tripStartDate);
                }
              }}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate trip"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Invite Friends Sheet */}
      <Sheet open={showInviteSheet} onOpenChange={setShowInviteSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" />Invite Friends</SheetTitle>
            <SheetDescription>Share this itinerary with friends via email</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-lg px-3">
                <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                <Input type="email" placeholder="friend@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm" style={{ fontSize: '16px' }} />
              </div>
              <Button disabled={!inviteEmail.trim()} onClick={() => { handleCopyLink(); setInviteEmail(""); }}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />{copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleShareWhatsApp}>
                <MessageCircle className="w-4 h-4" />WhatsApp
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Collaborator Sheet */}
      <Sheet open={showCollaboratorSheet} onOpenChange={setShowCollaboratorSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Add Collaborators</SheetTitle>
            <SheetDescription>Invite people to edit and plan this trip together</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-lg px-3">
                <UserPlus className="w-4 h-4 text-muted-foreground mr-2" />
                <Input type="email" placeholder="collaborator@email.com" value={collaboratorEmail} onChange={(e) => setCollaboratorEmail(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm" style={{ fontSize: '16px' }} />
              </div>
              <Button disabled={!collaboratorEmail.trim()} onClick={() => setCollaboratorEmail("")}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Collaborators can add experiences, edit the schedule, and help plan the trip.</p>
          </div>
        </SheetContent>
      </Sheet>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </Wrapper>
  );
};

export default PublicItinerary;
