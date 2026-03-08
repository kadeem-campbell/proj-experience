import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { allExperiences } from "@/hooks/useExperiencesData";
import { ExperienceCard } from "@/components/ExperienceCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, setHours, setMinutes, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { publicItinerariesData, getPopularItineraries, getFaveItineraries } from "@/data/itinerariesData";
import { CopyItineraryDialog } from "@/components/CopyItineraryDialog";
import { LikedExperience, TimeSlot } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
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
  Minus,
  Rocket,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Globe,
  Lock,
  Palette,
  Edit2,
  Trash2
} from "lucide-react";

// Time slot configurations
const timeSlotConfig: Record<TimeSlot, { label: string; icon: React.ReactNode; hour: number }> = {
  morning: { label: "Morning", icon: <Sunrise className="w-3 h-3" />, hour: 9 },
  afternoon: { label: "Afternoon", icon: <Sun className="w-3 h-3" />, hour: 14 },
  evening: { label: "Evening", icon: <Sunset className="w-3 h-3" />, hour: 18 },
  night: { label: "Night", icon: <Moon className="w-3 h-3" />, hour: 21 },
};

const PublicItinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('local_likes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [draggedExperience, setDraggedExperience] = useState<LikedExperience | null>(null);
  const [newItineraryName, setNewItineraryName] = useState("");
  const [showNewItineraryInput, setShowNewItineraryInput] = useState<string | null>(null);
  
  // Trip generation state
  const [showTripView, setShowTripView] = useState(false);
  const [showTripDateSheet, setShowTripDateSheet] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [generatedTrip, setGeneratedTrip] = useState<Record<string, LikedExperience[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomizeSheet, setShowCustomizeSheet] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState("");
  
  const { 
    addExperience, 
    removeExperience, 
    addExperienceToItinerary, 
    createItinerary, 
    itineraries, 
    isInItinerary,
    copyItinerary,
    togglePublic,
    createTrip
  } = useItineraries();
  const { isAuthenticated } = useAuth();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();

  // Unified like check and toggle for both auth and guest users
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


  const itinerary = publicItinerariesData.find(i => i.id === id);

  // Get the primary location of this itinerary
  const itineraryLocation = useMemo(() => {
    if (!itinerary) return '';
    const locations = itinerary.experiences.map(e => e.location).filter(Boolean);
    // Find most common location
    const freq: Record<string, number> = {};
    locations.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [itinerary]);

  // Get related experiences from same location (not in this itinerary)
  const relatedExperiences = useMemo(() => {
    if (!itinerary || !itineraryLocation) return [];
    const itineraryExpIds = new Set(itinerary.experiences.map(e => e.id));
    return allExperiences
      .filter(e => e.location?.toLowerCase().includes(itineraryLocation.toLowerCase()))
      .filter(e => !itineraryExpIds.has(e.id))
      .slice(0, 8);
  }, [itinerary, itineraryLocation]);

  if (!itinerary) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideTopBar: true } : {})}>
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
      </Wrapper>
    );
  }

  // Auto-generate trip based on experiences and their time slots
  const generateTrip = (startDate: Date, endDate?: Date) => {
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
    
    // Calculate number of days from date range or auto-calculate
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
      
      // Try to get one from each time slot for variety
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
      
      // Fill remaining slots if we haven't hit target
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
      
      // Sort by scheduled time
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
        // Re-sort
        updated[dayKey].sort((a, b) => 
          new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
        );
      }
      return updated;
    });
  };

  // Move experience to different day
  const handleMoveExperienceToDay = (expId: string, fromDay: string, toDay: string) => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      const exp = updated[fromDay]?.find(e => e.id === expId);
      if (!exp) return prev;
      
      // Remove from old day
      updated[fromDay] = updated[fromDay].filter(e => e.id !== expId);
      
      // Add to new day with updated time
      const newDate = new Date(toDay);
      const oldDate = new Date(exp.scheduledTime!);
      newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
      
      if (!updated[toDay]) updated[toDay] = [];
      updated[toDay].push({ ...exp, scheduledTime: newDate.toISOString() });
      updated[toDay].sort((a, b) => 
        new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
      );
      
      return updated;
    });
  };

  const handleSaveTrip = async () => {
    // Collect all experiences with scheduled times
    const scheduledExperiences = Object.values(generatedTrip).flat().map(exp => ({
      ...exp,
      likedAt: new Date().toISOString()
    }));
    
    // First, create or find the parent itinerary for this public itinerary
    const parentItineraryName = `${itinerary.name}`;
    let parentItinerary = itineraries.find(i => i.name === parentItineraryName);
    
    if (!parentItinerary) {
      // Create a new itinerary with the base experiences (unscheduled)
      parentItinerary = await createItinerary(parentItineraryName, itinerary.experiences.map(e => ({
        ...e,
        likedAt: new Date().toISOString()
      })));
    }
    
    // Now create a trip within this itinerary
    const startDateStr = tripStartDate ? format(tripStartDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    const endDateStr = tripEndDate ? format(tripEndDate, 'yyyy-MM-dd') : undefined;
    const newTripName = tripName.trim() || `Trip ${(parentItinerary.trips?.length || 0) + 1}`;
    
    const newTrip = await createTrip(parentItinerary.id, newTripName, startDateStr, endDateStr, scheduledExperiences);
    
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
    
    // Save itinerary ID and trip ID, show customize sheet
    setSavedItineraryId(parentItinerary.id);
    setSavedTripId(newTrip?.id || null);
    setShowCustomizeSheet(true);
  };

  const handleFinishCustomization = () => {
    setShowCustomizeSheet(false);
    if (savedItineraryId) {
      toast({
        title: "Trip created! 🎉",
        description: "Taking you to your new trip...",
      });
      // Stay on same page, just reset the generation view
      setShowTripView(false);
      setGeneratedTrip({});
      setTripStartDate(undefined);
      setTripEndDate(undefined);
      setTripName("");
      
      // Navigate to the trip page
      setTimeout(() => {
        navigate(`/trip/${savedItineraryId}${savedTripId ? `?trip=${savedTripId}` : ''}`);
      }, 100);
    }
  };

  const handleCreateAnotherTrip = () => {
    // Reset trip generation state to allow creating another trip
    setGeneratedTrip({});
    setTripStartDate(undefined);
    setTripEndDate(undefined);
    setTripName("");
    setShowTripView(false);
    toast({
      title: "Ready for another trip!",
      description: "Select new dates to create another trip from this itinerary.",
    });
  };

  const handleShare = async () => {
    // Use production URL for sharing
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    const shareUrl = `${baseUrl}/itineraries/${itinerary.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary.name,
          text: `Check out this itinerary: ${itinerary.name}`,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    const shareUrl = `${baseUrl}/itineraries/${itinerary.id}`;
    const text = `Check out this itinerary: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyComplete = () => {
    toast({
      title: "Itinerary copied!",
      description: "The experiences have been added to your collection.",
    });
  };

  const handleDragStart = (e: React.DragEvent, experience: LikedExperience) => {
    setDraggedExperience(experience);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(experience));
  };

  const handleDragEnd = () => {
    setDraggedExperience(null);
  };

  const handleToggleItinerary = (experience: LikedExperience, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInItinerary(experience.id)) {
      removeExperience(experience.id);
    } else {
      addExperience({
        id: experience.id,
        title: experience.title,
        creator: experience.creator,
        videoThumbnail: experience.videoThumbnail,
        category: experience.category,
        location: experience.location,
        price: experience.price,
        timeSlot: experience.timeSlot,
      });
    }
  };

  const handleAddToSpecificItinerary = (experience: LikedExperience, itineraryId: string, itineraryName: string) => {
    const targetItinerary = itineraries.find(i => i.id === itineraryId);
    if (targetItinerary?.experiences.some(e => e.id === experience.id)) {
      return;
    }

    addExperienceToItinerary(itineraryId, {
      id: experience.id,
      title: experience.title,
      creator: experience.creator,
      videoThumbnail: experience.videoThumbnail,
      category: experience.category,
      location: experience.location,
      price: experience.price,
      timeSlot: experience.timeSlot,
    });
  };

  const handleCreateAndAdd = async (experience: LikedExperience) => {
    if (!newItineraryName.trim()) return;
    
    const newItinerary = await createItinerary(newItineraryName.trim());
    await addExperienceToItinerary(newItinerary.id, {
      id: experience.id,
      title: experience.title,
      creator: experience.creator,
      videoThumbnail: experience.videoThumbnail,
      category: experience.category,
      location: experience.location,
      price: experience.price,
      timeSlot: experience.timeSlot,
    });
    
    toast({ title: "Created & added", description: `${experience.title} added to "${newItineraryName}".` });
    setNewItineraryName("");
    setShowNewItineraryInput(null);
  };

  // Filter experiences by search query
  const filteredExperiences = itinerary.experiences.filter((experience) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      experience.title?.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q)
    );
  });


  // Render experience card
  const renderExperienceCard = (experience: LikedExperience) => {
    const liked = isItemLiked(experience.id, 'experience');
    
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
      >
        <Card 
          className={cn(
            "group cursor-pointer transition-transform duration-150 border-0 bg-transparent p-0"
          )}
        >
          {/* Cover Image - match ExperienceCard geometry (4:3, rounded-xl) */}
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

            {/* Heart / Like button */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await handleToggleLike(experience.id, 'experience', {
                  id: experience.id,
                  title: experience.title,
                  creator: experience.creator,
                  videoThumbnail: experience.videoThumbnail,
                  category: experience.category,
                  location: experience.location,
                  price: experience.price,
                });
              }}
              className={cn(
                "absolute top-2.5 left-2.5 p-2 rounded-full transition-all duration-200 active:scale-90",
                "bg-background/50 backdrop-blur-xl border border-border/20 shadow-sm",
                "hover:bg-background/70",
                liked && "bg-primary/15"
              )}
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-all duration-200",
                  liked ? "fill-primary text-primary scale-110" : "text-foreground/80"
                )} 
              />
            </button>

            {/* More options: move to other itinerary, pin, remove */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-background/50 backdrop-blur-xl border border-border/20 shadow-sm hover:bg-background/70 transition-all duration-200 active:scale-90"
                >
                  <MoreHorizontal className="w-4 h-4 text-foreground/80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    // Pin functionality - move to top by removing and re-adding at position 0
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 rotate-90" />
                  Pin to top
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Copy to another itinerary
                </div>
                {itineraries.map((itin) => {
                  const isInThis = itin.experiences.some(e => e.id === experience.id);
                  return (
                    <DropdownMenuItem
                      key={itin.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToSpecificItinerary(experience, itin.id, itin.name);
                      }}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate text-sm">{itin.name}</span>
                      {isInThis && <Check className="w-3.5 h-3.5 text-primary ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
                {showNewItineraryInput === experience.id ? (
                  <div className="p-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Itinerary name..."
                      value={newItineraryName}
                      onChange={(e) => setNewItineraryName(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(experience); }}
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleCreateAndAdd(experience)} disabled={!newItineraryName.trim()}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); setShowNewItineraryInput(experience.id); }}
                    className="flex items-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" />
                    New Itinerary
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleItinerary(experience, e as any);
                  }}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from itinerary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Text content (match ExperienceCard) */}
          <div className="mt-2.5 space-y-0.5">
            <h3 className="font-semibold line-clamp-1 text-foreground text-sm leading-snug">
              {experience.title}
            </h3>
            <p className="text-[13px] text-muted-foreground truncate leading-relaxed">
              {experience.location}
            </p>
          </div>
        </Card>
      </Link>
    );
  };

  // Render generated trip timeline with editing capabilities
  const renderTripTimeline = () => {
    const days = Object.keys(generatedTrip).sort();
    
    return (
      <div className="space-y-6">
        {days.map((dayKey) => {
          const dayExperiences = generatedTrip[dayKey];
          const dayDate = new Date(dayKey);
          
          return (
            <div key={dayKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
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
                        )}
                        {exp.location && (
                          <span className="text-muted-foreground truncate">{exp.location}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Move to different day dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Move to day</div>
                        {days.filter(d => d !== dayKey).map(d => (
                          <DropdownMenuItem key={d} onClick={() => handleMoveExperienceToDay(exp.id, dayKey, d)}>
                            {format(new Date(d), "EEE, MMM d")}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setGeneratedTrip(prev => ({
                              ...prev,
                              [dayKey]: prev[dayKey].filter(e => e.id !== exp.id)
                            }));
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
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
        {/* Hero Cover Image - Full width with fade into background */}
        <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[440px] overflow-hidden">
          {itinerary.coverImage ? (
            <img 
              src={itinerary.coverImage} 
              alt={itinerary.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
              <span className="text-5xl">🗺️</span>
            </div>
          )}
          
          {/* Fade to background at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          {/* Subtle top darkening for button contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

          {/* Top buttons overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {/* Back button */}
            <button 
              onClick={() => {
                if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.origin)) {
                  navigate(-1);
                } else {
                  navigate('/itineraries');
                }
              }}
              className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Right: Share + Like */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors">
                    {copied ? <Check className="w-5 h-5 text-foreground" /> : <Share2 className="w-5 h-5 text-foreground" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={handleShare}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWhatsApp}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share via WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Like button (heart) */}
              <button 
                onClick={async () => {
                  await handleToggleLike(itinerary.id, 'itinerary', {
                    id: itinerary.id,
                    name: itinerary.name,
                    coverImage: itinerary.coverImage,
                    creatorName: itinerary.creatorName,
                  });
                }}
                className={cn(
                  "w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors",
                  isItemLiked(itinerary.id, 'itinerary') && "bg-primary/15"
                )}
              >
                <Heart className={cn(
                  "w-5 h-5 transition-all",
                  isItemLiked(itinerary.id, 'itinerary') 
                    ? "fill-primary text-primary" 
                    : "text-foreground"
                )} />
              </button>
            </div>
          </div>

          {/* Title text overlaid at bottom of hero, on top of the fade */}
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 lg:px-8 pb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-2 line-clamp-2 text-foreground drop-shadow-sm">
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
                <span>
                  by <span className="text-foreground font-semibold">@{itinerary.creatorName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Side: Experiences */}
          <div className={cn(
            "flex-1",
            showTripView ? "lg:w-[60%]" : "w-full"
          )}>
            {/* Search Bar */}
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
                
                <div className="flex items-center gap-2">
                  {/* Add all experiences to existing itinerary */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ListPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add All</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Add all experiences to...
                      </div>
                      {itineraries.map((itin) => (
                        <DropdownMenuItem
                          key={itin.id}
                          onClick={() => {
                            const existingIds = new Set(itin.experiences.map(e => e.id));
                            let added = 0;
                            itinerary.experiences.forEach(exp => {
                              if (!existingIds.has(exp.id)) {
                                addExperienceToItinerary(itin.id, {
                                  id: exp.id,
                                  title: exp.title,
                                  creator: exp.creator,
                                  videoThumbnail: exp.videoThumbnail,
                                  category: exp.category,
                                  location: exp.location,
                                  price: exp.price,
                                  timeSlot: exp.timeSlot,
                                });
                                added++;
                              }
                            });
                            toast({ 
                              title: added > 0 ? "Experiences added!" : "No new experiences", 
                              description: added > 0 
                                ? `${added} experience${added > 1 ? 's' : ''} added to "${itin.name}" (duplicates skipped).`
                                : `All experiences already exist in "${itin.name}".`
                            });
                          }}
                        >
                          <span className="truncate">{itin.name}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCopyDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Copy to new itinerary
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Make it a Trip action */}
                  {!showTripView && (
                    isMobile ? (
                      <>
                        <Button className="gap-2" onClick={() => setShowTripDateSheet(true)}>
                          <Rocket className="w-4 h-4" />
                          Trip
                        </Button>
                      </>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button className="gap-2">
                            <Rocket className="w-4 h-4" />
                            Make it a Trip
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <div className="flex flex-col">
                            <Calendar
                              mode="range"
                              selected={{ from: tripStartDate, to: tripEndDate }}
                              onSelect={(range) => {
                                setTripStartDate(range?.from);
                                setTripEndDate(range?.to);
                                if (range?.from && range?.to) {
                                  generateTrip(range.from, range.to);
                                }
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                              numberOfMonths={2}
                            />
                            {tripStartDate && !tripEndDate && (
                              <div className="p-3 pt-0 border-t border-border">
                                <Button 
                                  onClick={() => generateTrip(tripStartDate, tripStartDate)} 
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
                    )
                  )}
                  
                  {showTripView && (
                    <Button variant="outline" size="sm" onClick={() => setShowTripView(false)} className="gap-2">
                      <ChevronDown className="w-4 h-4" />
                      Collapse
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Experiences Grid - matching homepage card sizing */}
            <div className="p-3 md:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredExperiences.slice(0, 10).map(renderExperienceCard)}
              </div>

              {filteredExperiences.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No experiences found matching "{searchQuery}"</p>
                </div>
              )}

              {/* Related Experiences from same location */}
              {relatedExperiences.length > 0 && !showTripView && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    More experiences in {itineraryLocation}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {relatedExperiences.map((exp) => (
                      <ExperienceCard key={exp.id} {...exp} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Generated Trip (40%) */}
          {showTripView && (
            <div className="lg:w-[40%] bg-card/30 border-l border-border overflow-y-auto">
              <div className="p-4 md:p-6 sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Generated Trip
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
                  Save & Customize Trip
                </Button>
              </div>
              
              <div className="p-4 md:p-6">
                {Object.keys(generatedTrip).length > 0 ? (
                  renderTripTimeline()
                ) : (
                  <div className="text-center py-12">
                    <Rocket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                      Generating your trip schedule...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copy Dialog */}
        <CopyItineraryDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          sourceItinerary={itinerary}
          onCopyComplete={handleCopyComplete}
        />

        {/* Post-save Customization Sheet */}
        <Sheet open={showCustomizeSheet} onOpenChange={setShowCustomizeSheet}>
          <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Customize Your Trip
              </SheetTitle>
              <SheetDescription>Make it public and personalize your trip page</SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              {/* Visibility Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visibility
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => savedItineraryId && togglePublic(savedItineraryId)}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Make Public
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Keep Private
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Public trips can be discovered and spun up by other travelers
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { name: "Sunset", color: "#f97316", gradient: "from-orange-500/30 to-pink-500/30" },
                    { name: "Ocean", color: "#06b6d4", gradient: "from-cyan-500/30 to-blue-500/30" },
                    { name: "Midnight", color: "#a855f7", gradient: "from-purple-500/30 to-slate-900/30" },
                    { name: "Forest", color: "#10b981", gradient: "from-emerald-500/30 to-green-700/30" },
                    { name: "Ember", color: "#ef4444", gradient: "from-red-600/30 to-amber-500/30" },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      className={cn(
                        "aspect-square rounded-xl transition-all flex flex-col items-center justify-center gap-1 p-2 hover:scale-105",
                        `bg-gradient-to-br ${theme.gradient}`
                      )}
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-[10px] text-foreground/80">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleFinishCustomization} className="w-full">
                <ChevronRight className="w-4 h-4 mr-2" />
                Go to My Trip
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Wrapper>
  );
};

export default PublicItinerary;
