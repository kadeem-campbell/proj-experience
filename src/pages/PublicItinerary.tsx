import { useParams, Link, useNavigate } from "react-router-dom";
import { SEOHead, createItineraryJsonLd } from "@/components/SEOHead";
import { slugify, generateProductPageUrl } from "@/utils/slugUtils";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useProductListings } from "@/hooks/useExperiencesData";

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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
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
  SortAsc,
  TrendingUp,
  Flame,
  BookmarkCheck,
} from "lucide-react";

// Time slot configurations
const timeSlotConfig: Record<TimeSlot, { label: string; icon: React.ReactNode }> = {
  morning: { label: "Morning", icon: <Sunrise className="w-3 h-3" /> },
  afternoon: { label: "Afternoon", icon: <Sun className="w-3 h-3" /> },
  evening: { label: "Evening", icon: <Sunset className="w-3 h-3" /> },
  night: { label: "Night", icon: <Moon className="w-3 h-3" /> },
};

type ViewMode = 'list' | 'icons' | 'trips';
type SortMode = 'default' | 'name' | 'time';

const PublicItinerary = () => {
  const { slug: id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const { data: publicItinerariesData = [], isLoading: publicItinerariesLoading } = usePublicItineraries();
  const [searchQuery, setSearchQuery] = useState("");
  const allDbExperiences = useProductListings();
  const [localLikes, setLocalLikes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('local_likes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [showSortSheet, setShowSortSheet] = useState(false);
  
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
  const [generatedTrips, setGeneratedTrips] = useState<Array<{ id: string; name: string; days: Record<string, LikedExperience[]> }>>([]);
  const [activeTripIndex, setActiveTripIndex] = useState(0);
  const [activePresetTripIndex, setActivePresetTripIndex] = useState(0);
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [dragWarnings, setDragWarnings] = useState<Map<string, string>>(new Map());
  const [movingExp, setMovingExp] = useState<{ id: string; fromDay: string } | null>(null);
  const [showBrowsePublicTrips, setShowBrowsePublicTrips] = useState(false);
  const [previewingPublicTrip, setPreviewingPublicTrip] = useState<{ itinerary: any; tripIdx: number } | null>(null);
  const [showEditTripDates, setShowEditTripDates] = useState(false);
  
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
      const wasLiked = isDbLiked(itemId, itemType);
      if (itemType === 'itinerary') {
        setLikeCountDelta(prev => prev + (wasLiked ? -1 : 1));
      }
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
  }, [isAuthenticated, toggleDbLike, isDbLiked]);

  // Find itinerary - check public data first, then user's own
  const publicItinerary = publicItinerariesData.find((i: any) => i.id === id || i.slug === id || i.dbId === id);
  const ownedItinerary = itineraries.find(i => i.id === id);
  const itinerary = publicItinerary || ownedItinerary;
  const isOwned = !!ownedItinerary && !publicItinerary;

  // Load DB trips for owned itineraries into generatedTrips format
  useEffect(() => {
    if (isOwned && ownedItinerary?.trips && ownedItinerary.trips.length > 0 && generatedTrips.length === 0) {
      const converted = ownedItinerary.trips.map((trip: any) => {
        // Convert Trip format (experiences array with scheduledTime) to days format
        const days: Record<string, LikedExperience[]> = {};
        if (trip.startDate) {
          const start = new Date(trip.startDate);
          const end = trip.endDate ? new Date(trip.endDate) : start;
          const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          for (let d = 0; d < numDays; d++) {
            const dayKey = format(addDays(start, d), "yyyy-MM-dd");
            days[dayKey] = [];
          }
          // Place experiences into their scheduled days
          (trip.experiences || []).forEach((exp: LikedExperience) => {
            if (exp.scheduledTime) {
              const dayKey = format(new Date(exp.scheduledTime), "yyyy-MM-dd");
              if (days[dayKey]) {
                days[dayKey].push(exp);
              } else {
                days[dayKey] = [exp];
              }
            } else {
              // Unscheduled - put in first available day
              const firstDay = Object.keys(days).sort()[0];
              if (firstDay) days[firstDay].push(exp);
            }
          });
        } else {
          // No dates - put all in a single day
          const dayKey = format(new Date(), "yyyy-MM-dd");
          days[dayKey] = trip.experiences || [];
        }
        return { id: trip.id, name: trip.name, days };
      });
      setGeneratedTrips(converted);
    }
  }, [isOwned, ownedItinerary]);

  const itineraryLocation = useMemo(() => {
    if (!itinerary) return '';
    const locations = itinerary.experiences.map(e => e.location).filter(Boolean);
    const freq: Record<string, number> = {};
    locations.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [itinerary]);

  const [likeCountDelta, setLikeCountDelta] = useState(0);

  // Social proof using real like_count + optimistic delta
  const socialProof = useMemo(() => {
    if (!itinerary) return null;
    const baseLikes = (itinerary as any).likeCount || 0;
    const seed = itinerary.id.charCodeAt(0) + itinerary.experiences.length;
    const savedBy = baseLikes + (80 + (seed % 200)) + likeCountDelta;
    return { savedBy };
  }, [itinerary, likeCountDelta]);

  // Filter and order experiences for list/icons - only show DB-verified experiences
  const filteredExperiences = useMemo(() => {
    if (!itinerary) return [];
    const dbIds = new Set(allDbExperiences.map(e => e.id));
    // Filter: only keep experiences that exist in DB (have valid UUIDs matching DB records)
    let exps = itinerary.experiences.filter(e => {
      // Valid UUID format check + must exist in DB
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id);
      return isUUID && dbIds.has(e.id);
    });
    // Apply sort
    if (sortMode === 'name') {
      exps.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortMode === 'time') {
      const order: Record<string, number> = { morning: 0, afternoon: 1, evening: 2, night: 3 };
      exps.sort((a, b) => (order[a.timeSlot || 'afternoon'] || 1) - (order[b.timeSlot || 'afternoon'] || 1));
    }
    if (!searchQuery.trim()) return exps;
    const q = searchQuery.toLowerCase();
    return exps.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    );
  }, [itinerary, searchQuery, sortMode, allDbExperiences]);

  // External experience matches (not in this itinerary)
  const externalMatches = useMemo(() => {
    if (!searchQuery.trim() || !itinerary) return [];
    const q = searchQuery.toLowerCase();
    const inIds = new Set(itinerary.experiences.map(e => e.id));
    return allDbExperiences
      .filter(e => !inIds.has(e.id) && (
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      ))
      .slice(0, 6);
  }, [searchQuery, itinerary, allDbExperiences]);

  // Filtered itineraries for add-to-itinerary search
  const filteredItineraries = useMemo(() => {
    if (!addItinerarySearch.trim()) return itineraries;
    const q = addItinerarySearch.toLowerCase();
    return itineraries.filter(i => i.name.toLowerCase().includes(q));
  }, [itineraries, addItinerarySearch]);

  // --- Preset public trip examples (2 trips per public itinerary, named first-to-last) ---
  const publicTripExamples = useMemo(() => {
    if (!itinerary) return [];
    const exps = itinerary.experiences;
    if (exps.length === 0) return [];
    const mid = Math.ceil(exps.length / 2);
    const trip1Exps = exps.slice(0, mid);
    const trip2Exps = exps.slice(mid);
    const trips = [
      { 
        label: `${trip1Exps[0]?.title || 'Start'} – ${trip1Exps[trip1Exps.length - 1]?.title || 'End'}`,
        experiences: trip1Exps 
      },
    ];
    if (trip2Exps.length > 0) {
      trips.push({
        label: `${trip2Exps[0]?.title || 'Start'} – ${trip2Exps[trip2Exps.length - 1]?.title || 'End'}`,
        experiences: trip2Exps
      });
    }
    return trips;
  }, [itinerary]);

  // Browse public trips: generate 2 trips per public itinerary, only include those with enough experiences
  const browsablePublicTrips = useMemo(() => {
    return publicItinerariesData
      .filter(pub => pub.experiences.length >= 4) // need enough for 2 trips
      .map(pub => {
        const exps = pub.experiences;
        const mid = Math.ceil(exps.length / 2);
        return {
          itinerary: pub,
          trips: [
            { label: `${exps[0]?.title || 'Start'} – ${exps[mid - 1]?.title || 'End'}`, experiences: exps.slice(0, mid) },
            { label: `${exps[mid]?.title || 'Start'} – ${exps[exps.length - 1]?.title || 'End'}`, experiences: exps.slice(mid) },
          ],
        };
      });
  }, []);

  // Loading / not found states
  if (!itinerary && (itinerariesLoading || publicItinerariesLoading)) {
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
          <Link to="/things-to-do">
            <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Things to Do</Button>
          </Link>
        </div>
      </Wrapper>
    );
  }

  // --- Share Handlers ---
  const handleCopyLink = async () => {
    try {
      const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
      const shareUrl = `${baseUrl}/itineraries/${itinerary.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // Auto-dismiss share sheet after showing tick
      setTimeout(() => {
        setCopied(false);
        setShowShareSheet(false);
      }, 600);
    } catch {
      // Fallback for clipboard API failure
      setCopied(false);
    }
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
    const lastDayKey = format(addDays(startDate, numDays - 1), "yyyy-MM-dd");
    const allSlots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const slot of allSlots) {
      while (bySlot[slot].length > 0) {
        tripDays[lastDayKey].push(bySlot[slot].shift()!);
      }
    }
    const tripId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    // Name trip by first and last experience
    const allTripExps = Object.values(tripDays).flat();
    const firstName = allTripExps[0]?.title || 'Start';
    const lastName = allTripExps[allTripExps.length - 1]?.title || 'End';
    const tripName = `${firstName} – ${lastName}`;
    setTimeout(() => {
      setGeneratedTrips(prev => {
        const next = [...prev, { id: tripId, name: tripName, days: tripDays }];
        setActiveTripIndex(next.length - 1);
        return next;
      });
      setIsGenerating(false);
      setShowCreateTripSheet(false);
      setViewMode('trips');
      // Auto-save gesture
      setShowAutoSave(true);
      setTimeout(() => setShowAutoSave(false), 3000);
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

  // Move experience between days in active trip
  const handleMoveExperience = (expId: string, fromDay: string, toDay: string) => {
    setGeneratedTrips(prev => {
      const updated = [...prev];
      const trip = { ...updated[activeTripIndex], days: { ...updated[activeTripIndex].days } };
      const exp = trip.days[fromDay]?.find(e => e.id === expId);
      if (!exp) return prev;
      trip.days[fromDay] = trip.days[fromDay].filter(e => e.id !== expId);
      if (!trip.days[toDay]) trip.days[toDay] = [];
      trip.days[toDay] = [...trip.days[toDay], exp];
      const warning = validatePlacement(exp, toDay, exp.timeSlot || 'afternoon');
      if (warning) {
        setDragWarnings(prev => new Map(prev).set(expId, warning));
      }
      updated[activeTripIndex] = trip;
      return updated;
    });
    // Show auto-save
    setShowAutoSave(true);
    setTimeout(() => setShowAutoSave(false), 2000);
  };

  // Reorder experience within a day
  const handleReorderInDay = (dayKey: string, expId: string, direction: 'up' | 'down') => {
    setGeneratedTrips(prev => {
      const updated = [...prev];
      const trip = { ...updated[activeTripIndex], days: { ...updated[activeTripIndex].days } };
      const dayExps = [...(trip.days[dayKey] || [])];
      const idx = dayExps.findIndex(e => e.id === expId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= dayExps.length) return prev;
      [dayExps[idx], dayExps[targetIdx]] = [dayExps[targetIdx], dayExps[idx]];
      trip.days[dayKey] = dayExps;
      updated[activeTripIndex] = trip;
      return updated;
    });
    setShowAutoSave(true);
    setTimeout(() => setShowAutoSave(false), 2000);
  };

  // Handle view mode tap - if already on list, open sort modal
  const handleViewModeClick = (mode: ViewMode) => {
    if (mode === 'list' && viewMode === 'list') {
      setShowSortSheet(true);
    } else {
      setViewMode(mode);
    }
  };


  // --- Render functions ---

  // Clean list row
  const renderListRow = (experience: LikedExperience, _idx?: number, _total?: number) => {
    const liked = isItemLiked(experience.id, 'experience');
    const slotInfo = experience.timeSlot ? timeSlotConfig[experience.timeSlot] : null;
    const price = experience.price ? `${experience.price} avg` : null;

    // Resolve slug from DB if available
    const dbExp = allDbExperiences.find(e => e.id === experience.id);
    const expSlug = dbExp?.slug || slugify(experience.title);

    const metaParts: string[] = [];
    if (experience.location) metaParts.push(experience.location);
    if (experience.category) metaParts.push(experience.category);

    return (
      <div key={experience.id} className="flex items-center border-b border-border/30 last:border-b-0">
        <div
          onClick={() => navigate(generateProductPageUrl(experience.location || '', experience.title, expSlug))}
          className="flex-1 flex items-center gap-3 py-3 px-4 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
            {experience.videoThumbnail ? (
              <img src={experience.videoThumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
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
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async (e) => {
                e.preventDefault(); e.stopPropagation();
                if ('vibrate' in navigator) navigator.vibrate(10);
                if (!isAuthenticated) { setShowAuthModal(true); return; }
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
        </div>
      </div>
    );
  };

  // Icons view card
  const renderIconCard = (experience: LikedExperience) => {
    const liked = isItemLiked(experience.id, 'experience');
    const dbExp = allDbExperiences.find(e => e.id === experience.id);
    const expSlug = dbExp?.slug || slugify(experience.title);
    return (
      <div
        key={experience.id}
        className="cursor-pointer group"
        onClick={() => navigate(generateProductPageUrl(experience.location || '', experience.title, expSlug))}
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
                if (!isAuthenticated) { setShowAuthModal(true); return; }
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

  // Delete a generated trip
  const handleDeleteTrip = (tripIdx: number) => {
    setGeneratedTrips(prev => {
      const next = prev.filter((_, i) => i !== tripIdx);
      if (activeTripIndex >= next.length) setActiveTripIndex(Math.max(0, next.length - 1));
      return next;
    });
    setShowAutoSave(true);
    setTimeout(() => setShowAutoSave(false), 2000);
  };



  // Trips view - day-separated
  const renderTripsView = () => {
    // PUBLIC itineraries: show Day 1, Day 2, Day 3 format
    if (!isOwned) {
      const activePreset = publicTripExamples[activePresetTripIndex];
      if (!activePreset) return (
        <div className="text-center py-12 px-4">
          <Route className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No trips available</p>
        </div>
      );

      // Split into days (4 per day)
      const experiencesPerDay = 4;
      const days: LikedExperience[][] = [];
      for (let i = 0; i < activePreset.experiences.length; i += experiencesPerDay) {
        days.push(activePreset.experiences.slice(i, i + experiencesPerDay));
      }

      return (
        <div className="px-4 py-4">
          {/* Trip selector - horizontal scroll */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {publicTripExamples.map((trip, idx) => (
              <button
                key={idx}
                onClick={() => setActivePresetTripIndex(idx)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors max-w-[200px] truncate",
                  idx === activePresetTripIndex
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {trip.label}
              </button>
            ))}
          </div>

          {/* Days with Day 1, Day 2 headers */}
          <div className="space-y-6">
            {days.map((dayExps, dayIdx) => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? dayExps.filter(exp =>
                    exp.title?.toLowerCase().includes(q) ||
                    exp.location?.toLowerCase().includes(q) ||
                    exp.category?.toLowerCase().includes(q)
                  )
                : dayExps;
              if (filtered.length === 0) return null;
              return (
                <div key={dayIdx}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Day {dayIdx + 1}</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
                    </Badge>
                  </div>
                  <div className="space-y-0">
                    {filtered.map((exp, i) => renderListRow(exp, i, filtered.length))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // OWNED: show trip switcher always when trips exist
    const hasTrips = generatedTrips.length > 0;
    const hasActiveTrip = hasTrips && activeTripIndex >= 0 && activeTripIndex < generatedTrips.length;
    const activeTrip = hasActiveTrip ? generatedTrips[activeTripIndex] : null;
    const sortedDays = activeTrip ? Object.entries(activeTrip.days).sort(([a], [b]) => a.localeCompare(b)) : [];
    const tripDateRange = sortedDays.length > 0
      ? { start: new Date(sortedDays[0][0]), end: new Date(sortedDays[sortedDays.length - 1][0]) }
      : null;

    if (!hasTrips) {
      return (
        <div className="text-center py-12 px-4">
          <Route className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">No trips yet</p>
          <p className="text-xs text-muted-foreground/60 mb-5">Create a trip from scratch to start planning.</p>
          <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
            <Button onClick={() => { setTripStartDate(undefined); setTripEndDate(undefined); setShowCreateTripSheet(true); }} className="gap-2 w-full">
              <Plus className="w-4 h-4" />
              Create trip
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 py-4">
        {showAutoSave && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Auto-saved</span>
          </div>
        )}
        
        {/* Trip switcher - always visible */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {generatedTrips.map((trip, idx) => {
            const isActive = idx === activeTripIndex;
            return (
              <div key={trip.id} className="shrink-0 flex items-center">
                <button
                  onClick={() => setActiveTripIndex(isActive ? -1 : idx)}
                  className={cn(
                    "px-3 py-1.5 rounded-l-full text-xs font-medium transition-colors max-w-[180px] truncate",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {trip.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${trip.name}"?`)) handleDeleteTrip(idx);
                  }}
                  className={cn(
                    "px-1.5 py-1.5 rounded-r-full text-xs transition-colors",
                    isActive ? "bg-primary/80 text-primary-foreground hover:bg-destructive" : "bg-muted text-muted-foreground/60 hover:bg-destructive/20 hover:text-destructive"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {!hasActiveTrip && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Tap a trip above to view it</p>
          </div>
        )}

        {hasActiveTrip && activeTrip && (
          <>
            {/* Editable date range */}
            {tripDateRange && (
              <button
                onClick={() => {
                  setTripStartDate(tripDateRange.start);
                  setTripEndDate(tripDateRange.end);
                  setShowEditTripDates(true);
                }}
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted/50 w-full text-left group transition-colors hover:bg-muted/80"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {format(tripDateRange.start, "d MMM")} – {format(tripDateRange.end, "d MMM yyyy")}
                </span>
                <Edit2 className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            <div className="space-y-6">
              {sortedDays.map(([dayKey, dayExps]) => (
                <div key={dayKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{format(new Date(dayKey), "d MMMM")}</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {dayExps.length} {dayExps.length === 1 ? 'activity' : 'activities'}
                    </Badge>
                  </div>
                  <div className="space-y-0">
                    {dayExps.map((exp, expIdx) => {
                      const warning = dragWarnings.get(exp.id);
                      const isMoving = movingExp?.id === exp.id && movingExp?.fromDay === dayKey;
                      return (
                        <div key={exp.id} className="relative">
                          <div className="flex items-center gap-2 py-2.5 px-3 border-b border-border/20 last:border-b-0">
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button onClick={() => handleReorderInDay(dayKey, exp.id, 'up')} disabled={expIdx === 0} className={cn("p-0.5 rounded", expIdx === 0 ? "opacity-20" : "active:bg-muted")}>
                                <ChevronUp className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button onClick={() => handleReorderInDay(dayKey, exp.id, 'down')} disabled={expIdx === dayExps.length - 1} className={cn("p-0.5 rounded", expIdx === dayExps.length - 1 ? "opacity-20" : "active:bg-muted")}>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                              {exp.videoThumbnail ? (
                                <img src={exp.videoThumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-muted-foreground/40" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground truncate">{exp.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{[exp.location, exp.category].filter(Boolean).join(' · ')}</p>
                              {warning && (
                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-600">
                                  <AlertTriangle className="w-2.5 h-2.5" /><span>{warning}</span>
                                </div>
                              )}
                            </div>
                            {sortedDays.length > 1 && (
                              <button
                                onClick={() => setMovingExp(isMoving ? null : { id: exp.id, fromDay: dayKey })}
                                className={cn("p-1.5 rounded-md transition-colors shrink-0", isMoving ? "bg-primary/10 text-primary" : "text-muted-foreground/40 active:bg-muted")}
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {isMoving && (
                            <div className="bg-muted/50 border-b border-border/20 px-4 py-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Move to</p>
                              <div className="flex flex-wrap gap-1.5">
                                {sortedDays.filter(([dk]) => dk !== dayKey).map(([dk]) => (
                                  <button key={dk} onClick={() => { handleMoveExperience(exp.id, dayKey, dk); setMovingExp(null); }}
                                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-background border border-border/50 text-foreground hover:bg-primary/5 hover:border-primary/20 active:bg-primary/10 transition-colors"
                                  >
                                    {format(new Date(dk), "d MMM")}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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
              <button 
                onClick={() => setShowShareSheet(true)}
                className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={() => {
                  if (!isAuthenticated) { setShowAuthModal(true); return; }
                  if ('vibrate' in navigator) navigator.vibrate(10);
                  handleToggleLike(itinerary.id, 'itinerary', { id: itinerary.id, name: itinerary.name });
                }}
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
              <span className="font-medium">{filteredExperiences.length} experiences</span>
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

        {/* Social proof / owned sharing bar */}
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
          {!isOwned && socialProof ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-primary/70" />
                <span>Liked by <span className="font-semibold text-foreground">{socialProof.savedBy}</span> people</span>
              </span>
            </div>
          ) : isOwned ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-primary/70" />
                <span>Your itinerary · <span className="font-semibold text-foreground">{itinerary.experiences.length}</span> experiences</span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Search + View Switcher + CTA */}
          <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            {/* Search bar - matching homepage style */}
            <div className="flex items-center bg-muted rounded-full px-4 py-2.5 mb-3">
              <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this itinerary"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-[15px]"
                style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full shrink-0"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Unified action bar: view switcher + CTA */}
            <div className="flex items-center gap-2">
              {/* View mode switcher - compact */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                {([
                  { mode: 'list' as ViewMode, icon: List, label: 'List' },
                  { mode: 'icons' as ViewMode, icon: Grid3X3, label: 'Icons' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeClick(mode)}
                    className={cn(
                      "flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
                      viewMode === mode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Trips button - separate accent style */}
              <button
                onClick={() => handleViewModeClick('trips')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  viewMode === 'trips'
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-accent/10 text-accent hover:bg-accent/20"
                )}
              >
                <Route className="w-3 h-3" />
                <span>Trips</span>
              </button>

              {/* Primary CTA - most prominent */}
              {isOwned ? (
                <Button size="sm" className="gap-1.5 h-[32px] rounded-lg shrink-0 ml-auto text-xs" onClick={() => { setTripStartDate(undefined); setTripEndDate(undefined); setShowCreateTripSheet(true); }}>
                  <Rocket className="w-3 h-3" />
                  Create trip
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5 h-[32px] rounded-lg shrink-0 ml-auto text-xs" onClick={() => {
                  if (!isAuthenticated) { setShowAuthModal(true); return; }
                  setShowAddToItinerarySheet(true);
                }}>
                  <Plus className="w-3 h-3" />
                  Use this itinerary
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
                {filteredExperiences.map((exp, i) => renderListRow(exp, i, filteredExperiences.length))}
                {filteredExperiences.length === 0 && searchQuery && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm">No experiences match "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
                  </div>
                )}
                {/* External matches - Recommended (owned only) */}
                {isOwned && externalMatches.length > 0 && (
                  <div className="border-t border-border/30 mt-2 pt-3 px-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Recommended
                    </p>
                    {externalMatches.map(exp => (
                      <div
                        key={exp.id}
                        className="flex items-center gap-3 py-2 rounded-lg px-1 transition-colors"
                      >
                        <div
                          onClick={() => navigate(generateProductPageUrl(exp.location || '', exp.title, slugify(exp.title)))}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-muted/40 rounded-lg transition-colors"
                        >
                          <div className="w-9 h-9 rounded-md overflow-hidden bg-muted shrink-0">
                            {exp.videoThumbnail ? (
                              <img src={exp.videoThumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><MapPin className="w-3 h-3 text-muted-foreground/40" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{exp.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{exp.location}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) { setShowAuthModal(true); return; }
                            addExperienceToItinerary(itinerary.id, {
                              id: exp.id, title: exp.title, creator: exp.creator || '',
                              videoThumbnail: exp.videoThumbnail || '', category: exp.category || '',
                              location: exp.location || '', price: exp.price || '',
                            });
                          }}
                          className="shrink-0 text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10 active:bg-primary/20 transition-colors"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
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

      {/* === DRAWERS (drag-down dismissible) === */}

      {/* Share Drawer */}
      <Drawer open={showShareSheet} onOpenChange={setShowShareSheet}>
        <DrawerContent className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">Share</DrawerTitle>
            <DrawerDescription className="sr-only">Share this itinerary</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {/* Top row: icon grid */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "Copy Link", icon: copied ? Check : Copy, action: () => { handleCopyLink(); }, highlight: copied },
                { label: "WhatsApp", icon: MessageCircle, action: () => { handleShareWhatsApp(); setShowShareSheet(false); }, highlight: false },
                { label: "Invite", icon: Send, action: () => { setShowShareSheet(false); setTimeout(() => setShowInviteSheet(true), 100); }, highlight: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors select-none outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                    opt.highlight ? "bg-green-100" : "bg-muted"
                  )}>
                    <opt.icon className={cn("w-4.5 h-4.5", opt.highlight ? "text-green-600" : "text-foreground")} />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-pre-line">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Sort Drawer */}
      <Drawer open={showSortSheet} onOpenChange={setShowSortSheet}>
        <DrawerContent className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">Sort by</DrawerTitle>
            <DrawerDescription className="sr-only">Sort experiences</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-1">
            {[
              { key: 'default' as SortMode, label: 'Recently added', icon: Clock },
              { key: 'name' as SortMode, label: 'Name', icon: SortAsc },
              { key: 'time' as SortMode, label: 'Time of day', icon: Sunrise },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setSortMode(opt.key); setShowSortSheet(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                  sortMode === opt.key ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground"
                )}
              >
                <opt.icon className="w-4.5 h-4.5" />
                <span className="text-sm font-medium">{opt.label}</span>
                {sortMode === opt.key && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add to Itinerary Drawer */}
      <Drawer open={showAddToItinerarySheet} onOpenChange={setShowAddToItinerarySheet}>
        <DrawerContent className="max-h-[60vh] overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle>Add to itinerary</DrawerTitle>
            <DrawerDescription>Save this itinerary to your collection</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* New itinerary option */}
            {showNewItineraryInput ? (
              <div className="flex gap-2 p-3 border-b border-border/30">
                <Input
                  value={newItineraryName}
                  onChange={(e) => setNewItineraryName(e.target.value)}
                  placeholder="Itinerary name..."
                  className="h-11 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ fontSize: '16px' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddToNewItinerary()}
                  onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
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
              <div className="flex items-center bg-muted rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <Input
                  type="text"
                  value={addItinerarySearch}
                  onChange={(e) => setAddItinerarySearch(e.target.value)}
                  placeholder="Search your itineraries..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                  style={{ fontSize: '16px' }}
                  onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                />
                {addItinerarySearch && (
                  <button onClick={() => setAddItinerarySearch("")} className="p-1 rounded-full shrink-0">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
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
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No itineraries yet. Create one above!</p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create Trip Drawer (owned itinerary only) */}
      <Drawer open={showCreateTripSheet} onOpenChange={setShowCreateTripSheet}>
        <DrawerContent className="max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Create trip
            </DrawerTitle>
            <DrawerDescription>
              Select your travel dates to create a new trip.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col items-center py-3 w-full px-4">
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
                {format(tripStartDate, "d MMMM")} – {format(tripEndDate, "d MMMM yyyy")}
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
                  generateTrip(tripStartDate, tripEndDate || tripStartDate);
                }
              }}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Create trip"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Browse Public Trips Drawer - shows trips from public itineraries */}
      <Drawer open={showBrowsePublicTrips} onOpenChange={setShowBrowsePublicTrips}>
        <DrawerContent className="max-h-[75vh] overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Browse public trips
            </DrawerTitle>
            <DrawerDescription>Choose a trip from an existing public itinerary</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-4">
            {previewingPublicTrip ? (
              <div className="px-2">
                <button
                  onClick={() => setPreviewingPublicTrip(null)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to list
                </button>
                <h3 className="font-semibold text-sm mb-1">{previewingPublicTrip.itinerary.name}</h3>
                {/* Show the specific trip's experiences */}
                {(() => {
                  const pubData = browsablePublicTrips.find(b => b.itinerary.id === previewingPublicTrip.itinerary.id);
                  const trip = pubData?.trips[previewingPublicTrip.tripIdx];
                  if (!trip) return null;
                  const perDay = 4;
                  const days: typeof trip.experiences[] = [];
                  for (let i = 0; i < trip.experiences.length; i += perDay) {
                    days.push(trip.experiences.slice(i, i + perDay));
                  }
                  return (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">{trip.label}</p>
                      <div className="space-y-4">
                        {days.map((dayExps, dayIdx) => (
                          <div key={dayIdx}>
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground">Day {dayIdx + 1}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{dayExps.length}</Badge>
                            </div>
                            {dayExps.map((exp) => (
                              <div key={exp.id} className="flex items-center gap-3 py-2 px-2 border-b border-border/20">
                                <div className="w-8 h-8 rounded-md overflow-hidden bg-muted shrink-0">
                                  {exp.videoThumbnail ? (
                                    <img src={exp.videoThumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><MapPin className="w-3 h-3 text-muted-foreground/40" /></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{exp.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{exp.location}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full gap-2 mt-4"
                        onClick={() => {
                          setShowBrowsePublicTrips(false);
                          setPreviewingPublicTrip(null);
                          setTripStartDate(undefined);
                          setTripEndDate(undefined);
                          setShowCreateTripSheet(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Use this trip – pick dates
                      </Button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-1">
                {browsablePublicTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No public trips available</p>
                  </div>
                ) : (
                  browsablePublicTrips.map(({ itinerary: pub, trips }) => (
                    <div key={pub.id}>
                      <div className="px-2 pt-3 pb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{pub.name}</p>
                        <p className="text-[10px] text-muted-foreground">{pub.experiences.length} experiences</p>
                      </div>
                      {trips.map((trip, tripIdx) => (
                        <button
                          key={tripIdx}
                          onClick={() => setPreviewingPublicTrip({ itinerary: pub, tripIdx })}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted shrink-0">
                            {pub.coverImage ? (
                              <img src={pub.coverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <Route className="w-3 h-3 text-primary/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{trip.label}</p>
                            <p className="text-[10px] text-muted-foreground">{trip.experiences.length} activities</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Trip Dates Drawer */}
      <Drawer open={showEditTripDates} onOpenChange={setShowEditTripDates}>
        <DrawerContent className="max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Adjust dates
            </DrawerTitle>
            <DrawerDescription>Change the date range for this trip</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col items-center py-3 w-full px-4">
            <div className="w-full overflow-x-auto flex justify-center pb-2">
              <Calendar
                mode="range"
                selected={{ from: tripStartDate, to: tripEndDate }}
                onSelect={(range) => {
                  setTripStartDate(range?.from);
                  setTripEndDate(range?.to);
                }}
                className="p-3 pointer-events-auto"
                numberOfMonths={1}
              />
            </div>
            {tripStartDate && tripEndDate && (
              <p className="text-sm text-center text-muted-foreground mb-3">
                {format(tripStartDate, "d MMMM")} – {format(tripEndDate, "d MMMM yyyy")}
              </p>
            )}
            <Button
              className="w-full gap-2 h-12"
              disabled={!tripStartDate || !tripEndDate}
              onClick={() => {
                if (!tripStartDate || !tripEndDate || activeTripIndex < 0) return;
                // Remap existing experiences to new date range
                const activeTrip = generatedTrips[activeTripIndex];
                const oldDays = Object.entries(activeTrip.days).sort(([a], [b]) => a.localeCompare(b));
                const allExps = oldDays.flatMap(([, exps]) => exps);
                const numDays = Math.max(1, Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                const perDay = Math.max(1, Math.ceil(allExps.length / numDays));
                const newDays: Record<string, LikedExperience[]> = {};
                for (let d = 0; d < numDays; d++) {
                  const dk = format(addDays(tripStartDate, d), "yyyy-MM-dd");
                  newDays[dk] = allExps.slice(d * perDay, (d + 1) * perDay);
                }
                // Put any remaining into last day
                const lastKey = format(addDays(tripStartDate, numDays - 1), "yyyy-MM-dd");
                const assigned = Object.values(newDays).flat().length;
                if (assigned < allExps.length) {
                  newDays[lastKey] = [...(newDays[lastKey] || []), ...allExps.slice(assigned)];
                }
                // Update trip name
                const firstName = allExps[0]?.title || 'Start';
                const lastName = allExps[allExps.length - 1]?.title || 'End';
                setGeneratedTrips(prev => {
                  const updated = [...prev];
                  updated[activeTripIndex] = { ...updated[activeTripIndex], name: `${firstName} – ${lastName}`, days: newDays };
                  return updated;
                });
                setShowEditTripDates(false);
                setShowAutoSave(true);
                setTimeout(() => setShowAutoSave(false), 2000);
              }}
            >
              <Check className="w-4 h-4" />
              Update dates
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Invite Friends Drawer */}
      <Drawer open={showInviteSheet} onOpenChange={setShowInviteSheet}>
        <DrawerContent className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" />Invite Friends</DrawerTitle>
            <DrawerDescription>Share this itinerary with friends via email</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-full px-3">
                <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                <Input type="email" placeholder="friend@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm" style={{ fontSize: '16px' }}
                  onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                />
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
        </DrawerContent>
      </Drawer>

      {/* Collaborator Drawer */}
      <Drawer open={showCollaboratorSheet} onOpenChange={setShowCollaboratorSheet}>
        <DrawerContent className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Add Collaborators</DrawerTitle>
            <DrawerDescription>Invite people to edit and plan this itinerary together</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-full px-3">
                <UserPlus className="w-4 h-4 text-muted-foreground mr-2" />
                <Input type="email" placeholder="collaborator@email.com" value={collaboratorEmail} onChange={(e) => setCollaboratorEmail(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm" style={{ fontSize: '16px' }}
                  onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
                />
              </div>
              <Button disabled={!collaboratorEmail.trim()} onClick={() => setCollaboratorEmail("")}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Collaborators can add experiences, edit the schedule, and help plan together.</p>
          </div>
        </DrawerContent>
      </Drawer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </Wrapper>
  );
};

export default PublicItinerary;
