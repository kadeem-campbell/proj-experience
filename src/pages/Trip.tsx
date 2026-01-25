import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { format, parseISO, isSameDay, addDays, setHours, setMinutes } from "date-fns";
import confetti from "canvas-confetti";
import { MainLayout } from "@/components/layouts/MainLayout";
import { 
  Palette, MapPin, Users, Calendar, GripVertical, 
  Clock, ChevronRight, Sparkles, Bell, Rocket, ArrowLeft, Share2,
  Globe, Lock, Download, FileSpreadsheet, Settings,
  MessageCircle, Copy, Check, Plus, Trash2, Edit2, Camera, X,
  DollarSign, Timer, MoreVertical, Eye, Zap, LayoutGrid, CalendarDays,
  Link2, Mail, UserPlus, Search, MoreHorizontal, Sunrise, Sun, Sunset, Moon,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Itinerary, Trip as TripType, useItineraries } from "@/hooks/useItineraries";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { SpinUpModal } from "@/components/SpinUpModal";
import { publicItinerariesData } from "@/data/itinerariesData";
import { useToast } from "@/hooks/use-toast";
import { TripSelector } from "@/components/TripSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Theme configurations
const themes = {
  sunset: {
    name: "Sunset",
    gradient: "from-orange-500/30 via-pink-500/20 to-purple-600/30",
    accent: "text-orange-400",
    glow: "bg-orange-500/20",
    primary: "#f97316"
  },
  ocean: {
    name: "Ocean",
    gradient: "from-cyan-500/30 via-blue-500/20 to-indigo-600/30",
    accent: "text-cyan-400",
    glow: "bg-cyan-500/20",
    primary: "#06b6d4"
  },
  midnight: {
    name: "Midnight",
    gradient: "from-slate-800/50 via-purple-900/30 to-slate-900/50",
    accent: "text-purple-400",
    glow: "bg-purple-500/20",
    primary: "#a855f7"
  },
  forest: {
    name: "Forest",
    gradient: "from-emerald-600/30 via-teal-500/20 to-green-700/30",
    accent: "text-emerald-400",
    glow: "bg-emerald-500/20",
    primary: "#10b981"
  },
  ember: {
    name: "Ember",
    gradient: "from-red-600/30 via-orange-500/20 to-amber-500/30",
    accent: "text-red-400",
    glow: "bg-red-500/20",
    primary: "#ef4444"
  }
};

type ThemeKey = keyof typeof themes;

// Time slot configurations
const timeSlotConfig: Record<TimeSlot, { label: string; icon: React.ReactNode; hour: number }> = {
  morning: { label: "Morning", icon: <Sunrise className="w-3 h-3" />, hour: 9 },
  afternoon: { label: "Afternoon", icon: <Sun className="w-3 h-3" />, hour: 14 },
  evening: { label: "Evening", icon: <Sunset className="w-3 h-3" />, hour: 18 },
  night: { label: "Night", icon: <Moon className="w-3 h-3" />, hour: 21 },
};

interface TripPageProps {
  useActiveItinerary?: boolean;
}

export default function Trip({ useActiveItinerary = false }: TripPageProps) {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTripId = searchParams.get('trip');
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    activeItinerary,
    itineraries,
    removeExperience,
    togglePublic,
    getShareUrl,
    renameItinerary,
    addCollaborator,
    removeCollaborator,
    updateItineraryCover,
    updateExperienceDetails,
    addExperienceToItinerary,
    createTrip,
    deleteTrip,
    renameTrip,
    setActiveTrip,
    updateTripExperiences
  } = useItineraries();

  // Determine which itinerary to show
  const [loadedItinerary, setLoadedItinerary] = useState<Itinerary | null>(null);
  const [tripsOpen, setTripsOpen] = useState(true);
  
  const itinerary = useMemo(() => {
    if (useActiveItinerary) {
      return activeItinerary;
    }
    // First check user's own itineraries
    const fromHook = itineraries.find(i => i.id === id);
    if (fromHook) return fromHook;
    // Then check localStorage for shared/public itineraries
    return loadedItinerary;
  }, [useActiveItinerary, activeItinerary, itineraries, id, loadedItinerary]);

  // Get selected trip from itinerary
  const selectedTrip = useMemo(() => {
    if (!itinerary?.trips || itinerary.trips.length === 0) return null;
    if (selectedTripId) {
      return itinerary.trips.find(t => t.id === selectedTripId) || itinerary.trips[0];
    }
    return itinerary.trips.find(t => t.id === itinerary.activeTripId) || itinerary.trips[0];
  }, [itinerary, selectedTripId]);

  // Check if user owns this itinerary
  const isOwner = useMemo(() => {
    if (useActiveItinerary) return true;
    if (!itinerary) return false;
    return itineraries.some(i => i.id === itinerary.id);
  }, [useActiveItinerary, itinerary, itineraries]);

  // Trip selector handlers
  const handleSelectTrip = (tripId: string) => {
    setSearchParams({ trip: tripId });
    setShowTripView(true);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (itinerary) {
      deleteTrip(itinerary.id, tripId);
      toast({ title: "Trip deleted" });
    }
  };

  const handleRenameTrip = (tripId: string, newName: string) => {
    if (itinerary) {
      renameTrip(itinerary.id, tripId, newName);
    }
  };

  const handleCreateNewTrip = () => {
    setShowTripView(false);
    setGeneratedTrip({});
    setTripStartDate(undefined);
    setTripEndDate(undefined);
    toast({ title: "Select dates", description: "Pick a date range to create a new trip" });
  };

  // State
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("ocean");
  const [spinUpOpen, setSpinUpOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [draggedItem, setDraggedItem] = useState<LikedExperience | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [justSpunUp, setJustSpunUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Trip generation state (for personal itineraries without dates)
  const [showTripView, setShowTripView] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [generatedTrip, setGeneratedTrip] = useState<Record<string, LikedExperience[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const theme = themes[currentTheme];

  // Fire confetti on spin up completion
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const handleSpinUpComplete = useCallback((newItineraryId: string) => {
    setJustSpunUp(true);
    fireConfetti();
    setTimeout(() => setJustSpunUp(false), 5000);
  }, [fireConfetti]);

  // Load itinerary from localStorage if not in hook - with retry for race conditions
  useEffect(() => {
    const loadFromStorage = () => {
      if (!useActiveItinerary && id) {
        // First check if it's now in the itineraries hook
        const inHook = itineraries.find(i => i.id === id);
        if (inHook) {
          setLoadedItinerary(null); // Clear loaded as hook has it
          return;
        }
        
        const stored = localStorage.getItem('itineraries');
        if (stored) {
          const all: Itinerary[] = JSON.parse(stored);
          const found = all.find(i => i.id === id);
          if (found) setLoadedItinerary(found);
        }
      }
    };
    
    loadFromStorage();
    
    // Also listen for itinerary changes (for newly created itineraries)
    const handleItinerariesChanged = () => {
      loadFromStorage();
    };
    
    window.addEventListener('itinerariesChanged', handleItinerariesChanged);
    return () => window.removeEventListener('itinerariesChanged', handleItinerariesChanged);
  }, [id, itineraries, useActiveItinerary]);

  // Load theme from itinerary
  useEffect(() => {
    if (itinerary && (itinerary as any).theme) {
      setCurrentTheme((itinerary as any).theme as ThemeKey);
    }
  }, [itinerary]);

  // Check if itinerary has scheduled experiences (either via trips or legacy scheduledTime)
  const hasScheduledExperiences = useMemo(() => {
    if (!itinerary) return false;
    // Check if there are any trips with experiences
    if (itinerary.trips && itinerary.trips.length > 0) {
      return itinerary.trips.some(t => t.experiences && t.experiences.length > 0);
    }
    // Legacy: check itinerary.experiences for scheduledTime
    return itinerary.experiences.some(exp => exp.scheduledTime && exp.scheduledTime.includes('-'));
  }, [itinerary]);

  // Filter experiences by search query
  const filteredExperiences = useMemo(() => {
    if (!itinerary) return [];
    if (!searchQuery.trim()) return itinerary.experiences;
    const q = searchQuery.toLowerCase();
    return itinerary.experiences.filter(exp =>
      exp.title?.toLowerCase().includes(q) ||
      exp.location?.toLowerCase().includes(q) ||
      exp.category?.toLowerCase().includes(q)
    );
  }, [itinerary, searchQuery]);

  // Group experiences by date for planning view
  const { scheduledByDay, unscheduled, tripDays } = useMemo(() => {
    if (!itinerary) return { scheduledByDay: {}, unscheduled: [], tripDays: [] };
    
    const scheduled: Record<string, LikedExperience[]> = {};
    const floating: LikedExperience[] = [];
    
    itinerary.experiences.forEach(exp => {
      if (exp.scheduledTime && exp.scheduledTime.includes('-')) {
        const day = format(parseISO(exp.scheduledTime), "yyyy-MM-dd");
        if (!scheduled[day]) scheduled[day] = [];
        scheduled[day].push(exp);
      } else {
        floating.push(exp);
      }
    });
    
    Object.keys(scheduled).forEach(day => {
      scheduled[day].sort((a, b) => 
        new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
      );
    });
    
    const startDate = (itinerary as any).startDate 
      ? parseISO((itinerary as any).startDate)
      : Object.keys(scheduled).length > 0
        ? parseISO(Object.keys(scheduled).sort()[0])
        : new Date();
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(startDate, i), "yyyy-MM-dd"));
    }
    
    return { scheduledByDay: scheduled, unscheduled: floating, tripDays: days };
  }, [itinerary]);

  // Calculate totals
  const totalPrice = itinerary?.experiences.reduce((sum, exp) => {
    const price = parseFloat(exp.price?.replace(/[^0-9.]/g, '') || '0') || 0;
    return sum + price;
  }, 0) || 0;

  const totalDuration = itinerary?.experiences.reduce((sum, exp) => {
    return sum + (exp.estimatedDuration || 60);
  }, 0) || 0;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Auto-generate trip based on experiences and their time slots
  const generateTrip = (startDate: Date, endDate?: Date) => {
    if (!itinerary) return;
    setIsGenerating(true);
    
    // Group experiences by time slot
    const bySlot: Record<TimeSlot, LikedExperience[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };
    
    itinerary.experiences.forEach(exp => {
      const slot = exp.timeSlot || 'afternoon';
      bySlot[slot].push({ ...exp });
    });
    
    // Calculate number of days
    const totalExperiences = itinerary.experiences.length;
    const experiencesPerDay = 4;
    const autoNumDays = Math.max(1, Math.ceil(totalExperiences / experiencesPerDay));
    const numDays = endDate 
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : autoNumDays;
    
    const tripDays: Record<string, LikedExperience[]> = {};
    
    for (let day = 0; day < numDays; day++) {
      const dayKey = format(addDays(startDate, day), "yyyy-MM-dd");
      tripDays[dayKey] = [];
      
      const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
      
      for (const slot of slots) {
        if (bySlot[slot].length > 0 && tripDays[dayKey].length < experiencesPerDay) {
          const exp = bySlot[slot].shift()!;
          const slotHour = timeSlotConfig[slot].hour;
          const scheduledDate = setMinutes(setHours(addDays(startDate, day), slotHour), 0);
          
          tripDays[dayKey].push({
            ...exp,
            scheduledTime: scheduledDate.toISOString()
          });
        }
      }
      
      for (const slot of slots) {
        if (bySlot[slot].length > 0 && tripDays[dayKey].length < experiencesPerDay) {
          const exp = bySlot[slot].shift()!;
          const slotHour = timeSlotConfig[slot].hour;
          const scheduledDate = setMinutes(setHours(addDays(startDate, day), slotHour), 0);
          
          tripDays[dayKey].push({
            ...exp,
            scheduledTime: scheduledDate.toISOString()
          });
        }
      }
      
      tripDays[dayKey].sort((a, b) => 
        new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
      );
    }
    
    setTimeout(() => {
      setGeneratedTrip(tripDays);
      setIsGenerating(false);
      setShowTripView(true);
    }, 500);
  };

  const handleMakeItATrip = () => {
    if (!tripStartDate) {
      toast({
        title: "Select a date range",
        description: "Choose when your trip begins to generate a schedule.",
      });
      return;
    }
    generateTrip(tripStartDate, tripEndDate);
  };

  // Update experience time in generated trip
  const handleUpdateExperienceTime = (expId: string, newTime: string) => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      for (const dayKey of Object.keys(updated)) {
        updated[dayKey] = updated[dayKey].map(exp => 
          exp.id === expId ? { ...exp, scheduledTime: newTime } : exp
        );
        updated[dayKey].sort((a, b) => 
          new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
        );
      }
      return updated;
    });
  };

  // Save generated trip to itinerary
  const handleSaveTrip = () => {
    if (!itinerary || !tripStartDate) return;
    
    // Collect all scheduled experiences from the generated trip
    const allScheduledExperiences = Object.values(generatedTrip).flat();
    
    // Create a new Trip object with all the scheduled experiences
    const tripName = `Trip ${(itinerary.trips?.length || 0) + 1}`;
    const newTrip = createTrip(
      itinerary.id, 
      tripName, 
      tripStartDate.toISOString(), 
      tripEndDate?.toISOString(),
      allScheduledExperiences
    );
    
    // Fire confetti
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    
    toast({
      title: "Trip scheduled! 🎉",
      description: `${allScheduledExperiences.length} experiences have been scheduled.`,
    });

    // Keep the Trip View open and select the new trip
    setShowTripView(true);
    setGeneratedTrip({});
    setTripStartDate(undefined);
    setTripEndDate(undefined);
    
    // Select the newly created trip
    if (newTrip) {
      setSearchParams({ trip: newTrip.id });
    }
  };

  // Handle drag and drop for timeline (Owner only)
  const handleDragStart = (exp: LikedExperience) => {
    if (!isOwner) return;
    setDraggedItem(exp);
  };

  const handleDrop = (dayStr: string) => {
    if (!draggedItem || !itinerary || !isOwner) return;
    
    const newDate = new Date(dayStr);
    newDate.setHours(9, 0, 0, 0);
    
    updateExperienceDetails(draggedItem.id, { scheduledTime: newDate.toISOString() }, itinerary.id);
    setDraggedItem(null);
    toast({ title: "Scheduled!", description: `Added to ${format(newDate, "EEEE, MMM d")}` });
  };

  // Owner actions
  const handleStartEditName = () => {
    if (!itinerary || !isOwner) return;
    setEditedName(itinerary.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim() && itinerary) {
      renameItinerary(itinerary.id, editedName.trim());
      toast({ title: "Renamed!", description: "Itinerary name updated" });
    }
    setIsEditingName(false);
  };

  const handleCoverImageClick = () => {
    if (isOwner) fileInputRef.current?.click();
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && itinerary) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateItineraryCover(itinerary.id, base64);
        toast({ title: "Cover updated!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    if (!itinerary) return;
    const url = getShareUrl(itinerary.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleShareWhatsApp = () => {
    if (!itinerary) return;
    const shareUrl = getShareUrl(itinerary.id);
    const text = `Check out this trip: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddCollaborator = () => {
    if (collaboratorEmail.trim() && itinerary) {
      addCollaborator(itinerary.id, collaboratorEmail.trim());
      setCollaboratorEmail("");
      toast({ title: "Invite sent!", description: `${collaboratorEmail.trim()} has been invited` });
    }
  };

  const handleRemoveExperience = (experience: LikedExperience) => {
    if (!isOwner) return;
    removeExperience(experience.id);
    toast({ title: "Removed", description: `${experience.title} has been removed.` });
  };

  const handleExportCSV = () => {
    if (!itinerary) return;
    const headers = ['#', 'Title', 'Category', 'Location', 'Price', 'Scheduled Time', 'Notes'];
    const rows = itinerary.experiences.map((exp, i) => [
      i + 1, exp.title, exp.category || '', exp.location || '', exp.price || '',
      exp.scheduledTime || '', exp.notes || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itinerary.name.replace(/\s+/g, '_')}_trip.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!" });
  };

  const editingExperience = editingExperienceId 
    ? itinerary?.experiences.find(e => e.id === editingExperienceId)
    : null;

  const locations = [...new Set(itinerary?.experiences.map(e => e.location) || [])].filter(Boolean).slice(0, 3);
  const shareUrl = itinerary ? getShareUrl(itinerary.id) : '';

  // Render experience card - TikTok-style 3:4 aspect ratio
  const renderExperienceCard = (experience: LikedExperience) => {
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
      >
        <Card 
          className={cn(
            "group overflow-hidden border-0 bg-card hover:bg-accent/10 transition-colors duration-150 cursor-pointer rounded-lg p-2"
          )}
        >
          {/* Cover Image - 3:4 aspect ratio */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-md mb-2">
            {experience.videoThumbnail ? (
              <img 
                src={experience.videoThumbnail} 
                alt={experience.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
            )}
            
            {/* Category badge */}
            {experience.category && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                  {experience.category}
                </Badge>
              </div>
            )}
            
            {/* Owner controls - 3-dot menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="absolute bottom-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-background/90 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingExperienceId(experience.id);
                  }}>
                    <Edit2 className="w-3 h-3 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveExperience(experience);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Title and metadata */}
          <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">
            {experience.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {experience.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {experience.location}
              </span>
            )}
            {experience.price && <span className="shrink-0">{experience.price}</span>}
          </div>
        </Card>
      </Link>
    );
  };

  // Build trip data from selected trip's experiences
  const scheduledTripData = useMemo(() => {
    // If we have a selected trip, use its experiences
    if (selectedTrip && selectedTrip.experiences.length > 0) {
      const byDay: Record<string, LikedExperience[]> = {};
      selectedTrip.experiences.forEach(exp => {
        if (exp.scheduledTime) {
          const dayKey = format(parseISO(exp.scheduledTime), "yyyy-MM-dd");
          if (!byDay[dayKey]) byDay[dayKey] = [];
          byDay[dayKey].push(exp);
        }
      });
      // Sort each day by time
      Object.keys(byDay).forEach(day => {
        byDay[day].sort((a, b) => 
          new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
        );
      });
      return byDay;
    }
    // Fallback to legacy scheduledByDay from itinerary.experiences
    return scheduledByDay;
  }, [selectedTrip, scheduledByDay]);

  // Render trip timeline
  const renderTripTimeline = (
    tripData: Record<string, LikedExperience[]>,
    opts?: { editable?: boolean }
  ) => {
    const editable = !!opts?.editable;
    const days = Object.keys(tripData).sort();
    
    return (
      <div className="space-y-6">
        {days.map((dayKey) => {
          const dayExperiences = tripData[dayKey];
          const dayDate = new Date(dayKey);
          
          return (
            <div key={dayKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">{format(dayDate, "EEEE, MMM d")}</h4>
                <Badge variant="secondary" className="text-xs">{dayExperiences.length} experiences</Badge>
              </div>
              
              <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                {dayExperiences.map((exp) => (
                  <div 
                    key={exp.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card/60 border border-border/30 group"
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
                      {exp.videoThumbnail ? (
                        <img src={exp.videoThumbnail} alt={exp.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{exp.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {exp.scheduledTime && (
                          editable ? (
                            <Input
                              type="time"
                              value={format(new Date(exp.scheduledTime), "HH:mm")}
                              onChange={(e) => {
                                const [hours, mins] = e.target.value.split(':').map(Number);
                                const newDate = new Date(exp.scheduledTime!);
                                newDate.setHours(hours, mins, 0, 0);
                                handleUpdateExperienceTime(exp.id, newDate.toISOString());
                              }}
                              className="h-6 w-24 text-xs px-2"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(exp.scheduledTime), "h:mm a")}
                            </span>
                          )
                        )}
                        {exp.location && (
                          <span className="text-muted-foreground truncate">{exp.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!itinerary) {
    return (
      <MainLayout>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Itinerary Not Found</h1>
          <p className="text-muted-foreground mb-6">This itinerary doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const startDate = (itinerary as any).startDate 
    ? format(parseISO((itinerary as any).startDate), "MMMM d, yyyy")
    : "Dates TBD";

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Just Spun Up celebration banner */}
        {justSpunUp && (
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary p-3 text-center animate-fade-in">
            <p className="text-primary-foreground font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Welcome to your trip! You can now edit, organize, and make it yours.
              <Sparkles className="w-4 h-4" />
            </p>
          </div>
        )}

        {/* Header - Same style as PublicItinerary */}
        <div 
          className="relative bg-gradient-to-b from-primary/30 to-background p-4 md:p-6 pb-6 md:pb-8"
          style={{ background: `linear-gradient(180deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--background)) 100%)` }}
        >
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 md:gap-6">
            {/* Cover Image */}
            <div 
              className={cn(
                "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl",
                isOwner && "cursor-pointer group relative"
              )}
              onClick={handleCoverImageClick}
            >
              {itinerary.coverImage ? (
                <img src={itinerary.coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">🗺️</span>
                </div>
              )}
              {isOwner && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="hidden"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {isOwner ? "My Trip" : "Shared Trip"}
              </p>
              
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl md:text-3xl font-bold h-auto py-1 bg-muted max-w-md"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="icon" variant="secondary" onClick={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group mb-2 md:mb-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold line-clamp-2">
                    {itinerary.name}
                  </h1>
                  {isOwner && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={handleStartEditName}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                <span>{itinerary.experiences.length} experiences</span>
                {itinerary.isPublic ? (
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
                {locations.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {locations.join(" → ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-4 md:mt-6">
            {isOwner && (
              <>
                {/* Customize Button */}
                <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
                  <SheetTrigger asChild>
                    <Button variant="secondary" className="gap-2 rounded-full">
                      <Settings className="w-4 h-4" />
                      Customize
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Customize Your Trip</SheetTitle>
                      <SheetDescription>Personalize your trip page</SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6 py-6">
                      {/* Public URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Public URL
                        </label>
                        <div className="flex gap-2">
                          <Input value={shareUrl} readOnly className="text-xs bg-muted" />
                          <Button size="icon" variant="outline" onClick={handleCopyLink}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Visibility Toggle */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {itinerary.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          Visibility
                        </label>
                        <div className="flex gap-2">
                          <Button 
                            variant={itinerary.isPublic ? "default" : "outline"} 
                            size="sm"
                            className="flex-1"
                            onClick={() => !itinerary.isPublic && togglePublic(itinerary.id)}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Public
                          </Button>
                          <Button 
                            variant={!itinerary.isPublic ? "default" : "outline"} 
                            size="sm"
                            className="flex-1"
                            onClick={() => itinerary.isPublic && togglePublic(itinerary.id)}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Private
                          </Button>
                        </div>
                      </div>

                      {/* Theme Selector */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Theme
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                          {(Object.keys(themes) as ThemeKey[]).map((key) => (
                            <button
                              key={key}
                              onClick={() => setCurrentTheme(key)}
                              className={cn(
                                "aspect-square rounded-xl transition-all flex flex-col items-center justify-center gap-1 p-2",
                                `bg-gradient-to-br ${themes[key].gradient}`,
                                currentTheme === key 
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" 
                                  : "hover:scale-105 opacity-70 hover:opacity-100"
                              )}
                            >
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: themes[key].primary }}
                              />
                              <span className="text-[10px] text-white/80">{themes[key].name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Invite People */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Invite People
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="friend@email.com"
                            type="email"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
                          />
                          <Button onClick={handleAddCollaborator}>
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {itinerary.collaborators.length > 0 && (
                          <div className="space-y-2">
                            {itinerary.collaborators.map((collab) => (
                              <div key={collab} className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2">
                                <span className="truncate">{collab}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => removeCollaborator(itinerary.id, collab)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Share Buttons */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Share</label>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={handleShareWhatsApp}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>

                      {/* Export */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Export</label>
                        <Button variant="outline" className="w-full" onClick={handleExportCSV}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
            
            {/* Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share via WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isOwner && (
              <Button 
                size="lg"
                className="relative overflow-hidden group animate-pulse hover:animate-none"
                onClick={() => setSpinUpOpen(true)}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="relative flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Spin Up This Trip
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Side: Experiences Grid */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            showTripView ? "lg:w-[60%] border-r border-border" : "w-full"
          )}>
            {/* Search Bar + Make it a Trip */}
            <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground mr-2 md:mr-3" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search experiences..."
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                  />
                </div>
                
                {/* Make it a Trip - only show for owners without scheduled experiences */}
                {isOwner && !hasScheduledExperiences && !showTripView && itinerary.experiences.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Calendar className="w-4 h-4" />
                          {tripStartDate && tripEndDate 
                            ? `${format(tripStartDate, "MMM d")} - ${format(tripEndDate, "MMM d")}`
                            : tripStartDate 
                              ? format(tripStartDate, "MMM d")
                              : "Pick dates"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          mode="range"
                          selected={{ from: tripStartDate, to: tripEndDate }}
                          onSelect={(range) => {
                            setTripStartDate(range?.from);
                            setTripEndDate(range?.to);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Button 
                      onClick={handleMakeItATrip} 
                      disabled={!tripStartDate || isGenerating}
                      className="gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      {isGenerating ? "Generating..." : "Make it a Trip"}
                    </Button>
                  </div>
                )}

                {/* View Trip button - always visible when there are trips */}
                {isOwner && (itinerary?.trips?.length ?? 0) > 0 && !showTripView && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTripView(true)}>
                    <CalendarDays className="w-4 h-4" />
                    View Trip
                  </Button>
                )}
                
                {showTripView && (
                  <Button variant="ghost" size="sm" onClick={() => setShowTripView(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Close Trip View
                  </Button>
                )}
              </div>
            </div>

            {/* Experiences Grid */}
            <div className="p-3 md:p-6">
              {itinerary.experiences.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm mb-4">
                    {isOwner ? "No experiences yet. Start adding some!" : "This trip is empty"}
                  </p>
                  {isOwner && (
                    <Link to="/">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Discover Experiences
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {filteredExperiences.map(renderExperienceCard)}
                </div>
              )}

              {filteredExperiences.length === 0 && searchQuery && itinerary.experiences.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No experiences found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Generated Trip (40%) */}
          {showTripView && (
            <div className="lg:w-[40%] bg-card/30 border-l border-border overflow-y-auto">
              <div className="p-4 md:p-6 sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
                {/* Trip Selector - Always visible, expanded styling */}
                <div className="mb-4">
                  <TripSelector
                    trips={itinerary?.trips || []}
                    activeTripId={selectedTrip?.id}
                    onSelectTrip={handleSelectTrip}
                    onDeleteTrip={handleDeleteTrip}
                    onRenameTrip={handleRenameTrip}
                    onCreateTrip={handleCreateNewTrip}
                  />
                </div>

                {/* Show selected trip info or generation prompt */}
                {selectedTrip ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {selectedTrip.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(parseISO(selectedTrip.startDate), "MMM d")}
                      {selectedTrip.endDate && ` - ${format(parseISO(selectedTrip.endDate), "MMM d, yyyy")}`}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {selectedTrip.experiences?.length || 0} experiences scheduled
                    </p>
                  </>
                ) : Object.keys(generatedTrip).length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        New Trip
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {tripStartDate && tripEndDate 
                        ? `${format(tripStartDate, "MMM d")} - ${format(tripEndDate, "MMM d, yyyy")}`
                        : tripStartDate && format(tripStartDate, "MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Edit times and reorder before saving
                    </p>
                    <Button onClick={handleSaveTrip} className="w-full gap-2">
                      <Check className="w-4 h-4" />
                      Save Trip
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {(itinerary?.trips?.length || 0) === 0 
                        ? "Create your first trip schedule"
                        : "Select a trip or create a new one"}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 md:p-6">
                 {Object.keys(generatedTrip).length > 0
                   ? renderTripTimeline(generatedTrip, { editable: true })
                   : hasScheduledExperiences
                     ? renderTripTimeline(scheduledTripData, { editable: false })
                     : (
                       <div className="text-center py-12">
                         <Rocket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                         <p className="text-muted-foreground text-sm">
                           Generate your trip schedule to preview it here.
                         </p>
                       </div>
                     )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Experience Dialog */}
        <Dialog open={!!editingExperienceId} onOpenChange={(open) => !open && setEditingExperienceId(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Edit Experience</DialogTitle>
              <DialogDescription>
                Update details for {editingExperience?.title}
              </DialogDescription>
            </DialogHeader>
            {editingExperience && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Add notes about this experience..."
                    defaultValue={editingExperience.notes || ''}
                    onChange={(e) => updateExperienceDetails(editingExperience.id, { notes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheduled Time</label>
                  <Input
                    type="datetime-local"
                    defaultValue={editingExperience.scheduledTime?.slice(0, 16) || ''}
                    onChange={(e) => updateExperienceDetails(editingExperience.id, { scheduledTime: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <Button onClick={() => setEditingExperienceId(null)} className="w-full">
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* SpinUp Modal for non-owners */}
        <SpinUpModal 
          open={spinUpOpen}
          onOpenChange={setSpinUpOpen}
          sourceItinerary={itinerary}
          onSpinUpComplete={handleSpinUpComplete}
        />
      </div>
    </MainLayout>
  );
}
