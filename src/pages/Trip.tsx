import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { format, parseISO, isSameDay, addDays, setHours, setMinutes } from "date-fns";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { 
  Palette, MapPin, Users, Calendar, GripVertical, 
  Clock, ChevronRight, Sparkles, Bell, Rocket, ArrowLeft, Share2,
  Globe, Lock, Download, FileSpreadsheet, Settings,
  MessageCircle, Copy, Check, Plus, Trash2, Edit2, Camera, X,
  DollarSign, Timer, MoreVertical, Eye, Zap, LayoutGrid, CalendarDays,
  Link2, Mail, UserPlus, Search, MoreHorizontal, Sunrise, Sun, Sunset, Moon,
  ChevronDown, Presentation
} from "lucide-react";
import { DraggableTripItem } from "@/components/DraggableTripItem";
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
import { PresentationMode } from "@/components/PresentationMode";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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
  const [isCreatingNewTrip, setIsCreatingNewTrip] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  
  // Get selected trip from itinerary
  const selectedTrip = useMemo(() => {
    if (isCreatingNewTrip) return null;
    if (!itinerary?.trips || itinerary.trips.length === 0) return null;
    if (selectedTripId) {
      return itinerary.trips.find(t => t.id === selectedTripId) || itinerary.trips[0];
    }
    return itinerary.trips.find(t => t.id === itinerary.activeTripId) || itinerary.trips[0];
  }, [itinerary, selectedTripId, isCreatingNewTrip]);

  // Check if user owns this itinerary
  const isOwner = useMemo(() => {
    if (useActiveItinerary) return true;
    if (!itinerary) return false;
    return itineraries.some(i => i.id === itinerary.id);
  }, [useActiveItinerary, itinerary, itineraries]);

  // Trip selector handlers
  const handleSelectTrip = (tripId: string) => {
    setIsCreatingNewTrip(false);
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

  // Unified Make a Trip - triggered when dates are selected - auto-save
  const handleDateRangeSelected = async (startDate: Date, endDate?: Date) => {
    setTripStartDate(startDate);
    setTripEndDate(endDate);
    setIsCreatingNewTrip(true);
    setShowTripView(true);
    // Generate the trip immediately and auto-save
    await generateTripAndSave(startDate, endDate);
  };
  
  // Trip generation state (for personal itineraries without dates)
  // Default to experiences view - reset when navigating to this page
  const [showTripView, setShowTripView] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [generatedTrip, setGeneratedTrip] = useState<Record<string, LikedExperience[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset to experiences view when component mounts or ID changes
  useEffect(() => {
    setShowTripView(false);
    setIsCreatingNewTrip(false);
  }, [id]);

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

  // Load itinerary from localStorage or Supabase if not in hook
  useEffect(() => {
    const loadItinerary = async () => {
      if (!useActiveItinerary && id) {
        // First check if it's now in the itineraries hook
        const inHook = itineraries.find(i => i.id === id);
        if (inHook) {
          setLoadedItinerary(null); // Clear loaded as hook has it
          return;
        }
        
        // Check localStorage
        const stored = localStorage.getItem('itineraries');
        if (stored) {
          const all: Itinerary[] = JSON.parse(stored);
          const found = all.find(i => i.id === id);
          if (found) {
            setLoadedItinerary(found);
            return;
          }
        }
        
        // Fetch from Supabase for public itineraries
        try {
          const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .eq('is_public', true)
            .single();
          
          if (data && !error) {
            const publicItinerary: Itinerary = {
              id: data.id,
              name: data.name,
              experiences: (data.experiences as unknown as LikedExperience[]) || [],
              createdAt: data.created_at || new Date().toISOString(),
              updatedAt: data.updated_at || new Date().toISOString(),
              isPublic: data.is_public || false,
              collaborators: data.collaborators || [],
              coverImage: data.cover_image || undefined,
              tag: data.tag as 'popular' | 'fave' | undefined,
              startDate: data.start_date || undefined,
              theme: data.theme || undefined,
              trips: (data.trips as unknown as TripType[]) || [],
              activeTripId: data.active_trip_id || undefined
            };
            setLoadedItinerary(publicItinerary);
          }
        } catch (err) {
          console.error('Error fetching public itinerary:', err);
        }
      }
    };
    
    loadItinerary();
    
    // Also listen for itinerary changes (for newly created itineraries)
    const handleItinerariesChanged = () => {
      loadItinerary();
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

  // Auto-generate trip based on experiences and their time slots - returns trip data
  const generateTripData = (startDate: Date, endDate?: Date): Record<string, LikedExperience[]> => {
    if (!itinerary) return {};
    
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
    
    return tripDays;
  };

  // Generate trip and auto-save
  const generateTripAndSave = async (startDate: Date, endDate?: Date) => {
    if (!itinerary) return;
    setIsGenerating(true);
    
    const tripDays = generateTripData(startDate, endDate);
    setGeneratedTrip(tripDays);
    
    // Collect all scheduled experiences from the generated trip
    const allScheduledExperiences = Object.values(tripDays).flat();
    
    // Create a new Trip object with all the scheduled experiences
    const tripName = `Trip ${(itinerary.trips?.length || 0) + 1}`;
    const newTrip = await createTrip(
      itinerary.id, 
      tripName, 
      startDate.toISOString(), 
      endDate?.toISOString(),
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
      title: "Trip created! 🎉",
      description: `${allScheduledExperiences.length} experiences have been scheduled.`,
    });

    // Keep the Trip View open and select the new trip
    setShowTripView(true);
    setIsCreatingNewTrip(false);
    setGeneratedTrip({});
    setTripStartDate(undefined);
    setTripEndDate(undefined);
    setIsGenerating(false);
    
    // Select the newly created trip
    if (newTrip) {
      setSearchParams({ trip: newTrip.id });
    }
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

  // Save generated trip to itinerary - keeping for manual edits but auto-save is primary
  const handleSaveTrip = async () => {
    if (!itinerary || !tripStartDate) return;
    
    // Collect all scheduled experiences from the generated trip
    const allScheduledExperiences = Object.values(generatedTrip).flat();
    
    // Create a new Trip object with all the scheduled experiences
    const tripName = `Trip ${(itinerary.trips?.length || 0) + 1}`;
    const newTrip = await createTrip(
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
    setIsCreatingNewTrip(false);
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
    
    // Auto-make public when sharing
    if (!itinerary.isPublic && isOwner) {
      togglePublic(itinerary.id);
      toast({ title: "Made public & copied!", description: "Your trip is now shareable with anyone" });
    } else {
      toast({ title: "Link copied!" });
    }
    
    const url = getShareUrl(itinerary.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!itinerary) return;
    
    // Auto-make public when sharing
    if (!itinerary.isPublic && isOwner) {
      togglePublic(itinerary.id);
      toast({ title: "Made public!", description: "Your trip is now shareable" });
    }
    
    const shareUrl = getShareUrl(itinerary.id);
    const text = `Check out this trip: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddCollaborator = async () => {
    if (collaboratorEmail.trim() && itinerary) {
      const email = collaboratorEmail.trim();
      
      const result = await addCollaborator(itinerary.id, email);
      
      if (!result.success) {
        toast({ 
          title: "Cannot add collaborator", 
          description: result.message,
          variant: "destructive"
        });
        return;
      }
      
      setCollaboratorEmail("");
      
      if (result.emailSent) {
        toast({ 
          title: "Invitation sent! 📧", 
          description: `${email} will receive an email with a link to collaborate.` 
        });
      } else {
        toast({ 
          title: "Collaborator added", 
          description: result.message || `${email} can now access this trip when they sign in.`
        });
      }
    }
  };

  const handleRemoveExperience = (experience: LikedExperience) => {
    if (!isOwner) return;
    removeExperience(experience.id);
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

  // Render experience card - match PublicItinerary exactly
  const renderExperienceCard = (experience: LikedExperience) => {
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
      >
        <div className="group cursor-pointer transition-transform duration-150">
          {/* Cover Image - match PublicItinerary geometry (4:3, rounded-xl) */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {experience.videoThumbnail ? (
              <img 
                src={experience.videoThumbnail} 
                alt={experience.title}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            
            {/* Owner controls - 3-dot menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className={cn(
                      "absolute top-2.5 right-2.5 p-2 rounded-full bg-background/50 backdrop-blur-xl border border-border/20 shadow-sm hover:bg-background/70 transition-all duration-200",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <MoreHorizontal className="w-4 h-4 text-foreground/80" />
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
          
          {/* Text content - match PublicItinerary */}
          <div className="mt-2.5 space-y-0.5">
            <h3 className="font-semibold line-clamp-1 text-foreground text-sm leading-snug">
              {experience.title}
            </h3>
            <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
              {experience.location}
            </p>
          </div>
        </div>
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

  // Handle time change for trip experiences
  const handleTripTimeChange = useCallback((expId: string, newTime: string) => {
    if (!itinerary || !selectedTrip) return;
    
    const updatedExperiences = selectedTrip.experiences.map(exp =>
      exp.id === expId ? { ...exp, scheduledTime: newTime } : exp
    ).sort((a, b) => 
      new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
    );
    
    updateTripExperiences(itinerary.id, selectedTrip.id, updatedExperiences);
  }, [itinerary, selectedTrip, updateTripExperiences]);

  // Handle reordering within a day
  const handleTripReorder = useCallback((dayKey: string, fromIndex: number, toIndex: number) => {
    if (!itinerary || !selectedTrip) return;
    
    // Get experiences for this day
    const dayExperiences = selectedTrip.experiences
      .filter(exp => exp.scheduledTime && format(parseISO(exp.scheduledTime), "yyyy-MM-dd") === dayKey)
      .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
    
    // Reorder within the day
    const [moved] = dayExperiences.splice(fromIndex, 1);
    dayExperiences.splice(toIndex, 0, moved);
    
    // Update times to reflect new order (maintain same time slots but swap)
    const times = dayExperiences.map(exp => exp.scheduledTime);
    const reorderedWithTimes = dayExperiences.map((exp, idx) => ({
      ...exp,
      scheduledTime: times[idx]
    }));
    
    // Rebuild full experiences list
    const otherExperiences = selectedTrip.experiences.filter(
      exp => !exp.scheduledTime || format(parseISO(exp.scheduledTime), "yyyy-MM-dd") !== dayKey
    );
    
    const updatedExperiences = [...otherExperiences, ...reorderedWithTimes].sort((a, b) => 
      new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
    );
    
    updateTripExperiences(itinerary.id, selectedTrip.id, updatedExperiences);
  }, [itinerary, selectedTrip, updateTripExperiences]);

  // Handle removing experience from trip
  const handleRemoveFromTrip = useCallback((expId: string) => {
    if (!itinerary || !selectedTrip) return;
    
    const updatedExperiences = selectedTrip.experiences.filter(exp => exp.id !== expId);
    updateTripExperiences(itinerary.id, selectedTrip.id, updatedExperiences);
    toast({ title: "Removed from trip" });
  }, [itinerary, selectedTrip, updateTripExperiences, toast]);

  // Handle moving experience to a different day
  const handleMoveToDay = useCallback((expId: string, targetDayKey: string) => {
    if (!itinerary || !selectedTrip) return;
    
    const experience = selectedTrip.experiences.find(exp => exp.id === expId);
    if (!experience || !experience.scheduledTime) return;
    
    // Parse target day and preserve the time
    const currentTime = parseISO(experience.scheduledTime);
    const targetDate = parseISO(targetDayKey);
    const newScheduledTime = setMinutes(
      setHours(targetDate, currentTime.getHours()),
      currentTime.getMinutes()
    );
    
    const updatedExperiences = selectedTrip.experiences.map(exp =>
      exp.id === expId ? { ...exp, scheduledTime: newScheduledTime.toISOString() } : exp
    ).sort((a, b) => 
      new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
    );
    
    updateTripExperiences(itinerary.id, selectedTrip.id, updatedExperiences);
    toast({ title: "Moved to " + format(targetDate, "EEEE, MMM d") });
  }, [itinerary, selectedTrip, updateTripExperiences, toast]);

  // Handle drop on day header (cross-day move via desktop drag)
  const handleDayDrop = useCallback((e: React.DragEvent, targetDayKey: string) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.dayKey !== targetDayKey && data.expId) {
        handleMoveToDay(data.expId, targetDayKey);
      }
    } catch (err) {
      console.error("Day drop error:", err);
    }
  }, [handleMoveToDay]);

  const handleDayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

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
              {/* Day header - droppable on desktop */}
              <div 
                className="flex items-center gap-2 p-2 -ml-2 rounded-lg transition-colors hover:bg-primary/5"
                onDragOver={handleDayDragOver}
                onDrop={(e) => handleDayDrop(e, dayKey)}
              >
                <Calendar className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">{format(dayDate, "EEEE, MMM d")}</h4>
                <Badge variant="secondary" className="text-xs">{dayExperiences.length} experiences</Badge>
              </div>
              
              <div 
                className="space-y-2 pl-6 border-l-2 border-primary/20 min-h-[40px]"
                onDragOver={handleDayDragOver}
                onDrop={(e) => handleDayDrop(e, dayKey)}
              >
                {dayExperiences.map((exp, idx) => (
                  <DraggableTripItem
                    key={exp.id}
                    experience={exp}
                    index={idx}
                    totalItems={dayExperiences.length}
                    isOwner={isOwner}
                    onTimeChange={editable ? handleUpdateExperienceTime : handleTripTimeChange}
                    onReorder={(from, to) => {
                      if (editable) {
                        // For generated trip (preview), update local state
                        setGeneratedTrip(prev => {
                          const updated = { ...prev };
                          const dayItems = [...(updated[dayKey] || [])];
                          const [moved] = dayItems.splice(from, 1);
                          dayItems.splice(to, 0, moved);
                          // Swap times to maintain order
                          const times = dayItems.map(e => e.scheduledTime);
                          updated[dayKey] = dayItems.map((e, i) => ({ ...e, scheduledTime: times[i] }));
                          return updated;
                        });
                      } else {
                        handleTripReorder(dayKey, from, to);
                      }
                    }}
                    onMoveToDay={isOwner ? handleMoveToDay : undefined}
                    onRemove={isOwner ? handleRemoveFromTrip : undefined}
                    dayKey={dayKey}
                    allDays={days}
                  />
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
          <Link to="/experiences">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Experiences
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const startDate = (itinerary as any).startDate 
    ? format(parseISO((itinerary as any).startDate), "MMMM d, yyyy")
    : "Dates TBD";

  const Wrapper = isMobile ? MobileShell : MainLayout;
  const wrapperProps = isMobile ? { hideTopBar: true } : {};

  return (
    <Wrapper {...wrapperProps}>
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
          <button 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/itineraries');
              }
            }}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

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
                    className="text-2xl sm:text-3xl md:text-4xl font-bold h-auto py-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName}>
                    <Check className="w-5 h-5 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <h1 
                  className={cn(
                    "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2",
                    isOwner && "cursor-pointer hover:text-primary/90 transition-colors"
                  )}
                  onClick={handleStartEditName}
                >
                  {itinerary.name}
                </h1>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">{itinerary.experiences.length} experiences</span>
                <span>•</span>
                <span>${totalPrice.toFixed(0)} total</span>
                {locations.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {locations.join(', ')}
                    </span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {/* Presentation Mode Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setPresentationOpen(true)}
                >
                  <Presentation className="w-4 h-4" />
                  Present
                </Button>

                {/* Share Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border-border">
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

                {/* Visibility Toggle */}
                {isOwner && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => togglePublic(itinerary.id)}
                    className="gap-2"
                  >
                    {itinerary.isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-primary">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Private
                      </>
                    )}
                  </Button>
                )}

                {/* Invite Collaborators Dialog */}
                {isOwner && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite People</DialogTitle>
                        <DialogDescription>
                          Invite friends to collaborate on this trip. They'll receive an email with a link to join.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 pt-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter email address"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
                          />
                          <Button onClick={handleAddCollaborator} disabled={!collaboratorEmail.trim()}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                        
                        {itinerary.collaborators.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Collaborators</p>
                            {itinerary.collaborators.map((email) => (
                              <div key={email} className="flex items-center justify-between text-sm bg-muted rounded-md px-3 py-2">
                                <span>{email}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeCollaborator(itinerary.id, email)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Export */}
                <Button variant="ghost" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Toggle View (Experiences OR Trip, not side-by-side) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Header with Search and View Switch */}
          <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar - only show in experiences view */}
              {!showTripView && (
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
              )}
              
              {/* Trip header when in trip view */}
              {showTripView && (
                <div className="flex-1">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {isCreatingNewTrip ? "Your Generated Trip" : selectedTrip?.name || "Trip Schedule"}
                  </h3>
                  {(isCreatingNewTrip || selectedTrip) && (
                    <p className="text-sm text-muted-foreground">
                      {isCreatingNewTrip && tripStartDate && tripEndDate 
                        ? `${format(tripStartDate, "MMM d")} - ${format(tripEndDate, "MMM d, yyyy")}`
                        : selectedTrip?.startDate && `${format(parseISO(selectedTrip.startDate), "MMM d")}${selectedTrip.endDate ? ` - ${format(parseISO(selectedTrip.endDate), "MMM d")}` : ''}`}
                      {selectedTrip && ` · ${selectedTrip.experiences.length} activities`}
                    </p>
                  )}
                </div>
              )}
              
              {/* Action buttons - UNIFIED TRIPS DROPDOWN */}
              <div className="flex items-center gap-2">
                {isOwner && !showTripView && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {(itinerary.trips?.length || 0) > 0 
                          ? `Trips (${itinerary.trips?.length})`
                          : "Make a Trip"
                        }
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                      <div className="p-2">
                        {/* Add new trip with date picker */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mb-1">
                              <Plus className="w-4 h-4" />
                              {(itinerary.trips?.length || 0) > 0 ? "Add another trip" : "Pick dates"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 max-h-[80vh] overflow-auto" align="end" side="bottom" sideOffset={8}>
                            <div className="flex flex-col">
                              <CalendarComponent
                                mode="range"
                                selected={{ from: tripStartDate, to: tripEndDate }}
                                onSelect={(range) => {
                                  setTripStartDate(range?.from);
                                  setTripEndDate(range?.to);
                                  if (range?.from && range?.to) {
                                    handleDateRangeSelected(range.from, range.to);
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                                numberOfMonths={1}
                              />
                              {tripStartDate && !tripEndDate && (
                                <div className="p-3 pt-0 border-t border-border">
                                  <Button 
                                    onClick={() => handleDateRangeSelected(tripStartDate, tripStartDate)} 
                                    size="sm" 
                                    className="w-full"
                                  >
                                    Use {format(tripStartDate, "MMM d")} only
                                  </Button>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Existing trips list */}
                        {(itinerary.trips?.length || 0) > 0 && (
                          <div className="border-t border-border pt-2 mt-1 space-y-1">
                            {itinerary.trips?.map((trip, index) => (
                              <Button
                                key={trip.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between"
                                onClick={() => {
                                  handleSelectTrip(trip.id);
                                  setShowTripView(true);
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="truncate">{trip.name}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {trip.experiences.length} exp
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {/* Non-owner: just show View Trip if trips exist */}
                {!isOwner && (itinerary.trips?.length || 0) > 0 && !showTripView && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowTripView(true)}
                    className="gap-2"
                  >
                    <CalendarDays className="w-4 h-4" />
                    {(itinerary.trips?.length || 0) === 1 ? "View Trip" : `Trips (${itinerary.trips?.length})`}
                  </Button>
                )}
                
                {/* Back to Experiences button - switch back */}
                {showTripView && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setShowTripView(false); setIsCreatingNewTrip(false); }}
                    className="gap-2"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Experiences
                  </Button>
                )}
                
              </div>
            </div>
          </div>

          {/* Content Area - Either Experiences OR Trip (not both) with smooth transition */}
          <div className="flex-1 overflow-y-auto">
            <div className="transition-opacity duration-150 ease-out">
              {showTripView ? (
                /* Trip Timeline View - Full Width */
                <div className="p-4 md:p-6 animate-in fade-in duration-150">
                {isCreatingNewTrip ? (
                  Object.keys(generatedTrip).length > 0 ? (
                    renderTripTimeline(generatedTrip, { editable: true })
                  ) : (
                    <div className="text-center py-12">
                      <Rocket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">Generating your trip schedule...</p>
                    </div>
                  )
                ) : (
                  <>
                    {/* Trip selector for multiple trips */}
                    {(itinerary.trips?.length || 0) > 1 && (
                      <div className="mb-6 flex flex-wrap gap-2">
                        {itinerary.trips?.map((trip) => (
                          <Button
                            key={trip.id}
                            variant={selectedTrip?.id === trip.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectTrip(trip.id)}
                            className="gap-2"
                          >
                            {trip.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    {renderTripTimeline(scheduledTripData)}
                  </>
                )}
              </div>
            ) : (
              /* Experiences Grid View - 3 cols mobile, 6 cols desktop */
              <div className="p-3 md:p-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredExperiences.map(renderExperienceCard)}
                </div>

                {filteredExperiences.length === 0 && (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-medium mb-2">No experiences yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start adding experiences to build your perfect trip
                    </p>
                    <Link to="/">
                      <Button variant="outline" size="sm">
                        Discover Experiences
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>


        {/* Spin Up Modal (for non-owners) */}
        <SpinUpModal 
          open={spinUpOpen} 
          onOpenChange={setSpinUpOpen}
          sourceItinerary={itinerary}
          onSpinUpComplete={handleSpinUpComplete}
        />

        {/* Presentation Mode Dialog */}
        <PresentationMode
          open={presentationOpen}
          onOpenChange={setPresentationOpen}
          itinerary={itinerary}
          selectedTrip={selectedTrip}
          isOwner={isOwner}
        />
      </div>
    </Wrapper>
  );
}
