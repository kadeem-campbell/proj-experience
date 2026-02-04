import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { format, addDays, setHours, setMinutes, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { MainLayout } from "@/components/layouts/MainLayout";
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
  Eye,
  ChevronRight,
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
  const [copied, setCopied] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedExperience, setDraggedExperience] = useState<LikedExperience | null>(null);
  const [newItineraryName, setNewItineraryName] = useState("");
  const [showNewItineraryInput, setShowNewItineraryInput] = useState<string | null>(null);
  
  // Trip generation state
  const [showTripView, setShowTripView] = useState(false);
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

  // Find the public itinerary
  const itinerary = publicItinerariesData.find(i => i.id === id);

  // Get related public itineraries (same tag or similar location)
  // Must be called before early return to satisfy hooks rules
  const relatedItineraries = useMemo(() => {
    if (!itinerary) return [];
    return publicItinerariesData
      .filter(i => i.id !== itinerary.id)
      .filter(i => i.tag === itinerary.tag || 
        i.experiences.some(e => itinerary.experiences.some(ie => ie.location === e.location)))
      .slice(0, 6);
  }, [itinerary]);

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
    const shareUrl = `${baseUrl}/public-itinerary/${itinerary.id}`;
    
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
        toast({ title: "Link copied!", description: "Share this link with your friends." });
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with your friends." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    const shareUrl = `${baseUrl}/public-itinerary/${itinerary.id}`;
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
      toast({ title: "Removed from itinerary", description: `${experience.title} has been removed.` });
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
      toast({ title: "Added to itinerary", description: `${experience.title} has been added.` });
    }
  };

  const handleAddToSpecificItinerary = (experience: LikedExperience, itineraryId: string, itineraryName: string) => {
    const targetItinerary = itineraries.find(i => i.id === itineraryId);
    if (targetItinerary?.experiences.some(e => e.id === experience.id)) {
      toast({ title: "Already in itinerary", description: `${experience.title} is already in ${itineraryName}.` });
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
    
    toast({ title: "Added to itinerary", description: `${experience.title} added to ${itineraryName}.` });
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
    const inItinerary = isInItinerary(experience.id);
    const slotInfo = experience.timeSlot ? timeSlotConfig[experience.timeSlot] : null;
    
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
        draggable
        onDragStart={(e) => handleDragStart(e, experience)}
        onDragEnd={handleDragEnd}
      >
        <Card 
          className={cn(
            "group overflow-hidden border-0 bg-card hover:bg-accent/10 transition-colors duration-150 cursor-pointer rounded-lg p-2",
            draggedExperience?.id === experience.id && 'opacity-50 cursor-grabbing'
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
            
            {/* Category badge - no time slots shown (internal only) */}
            {experience.category && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                  {experience.category}
                </Badge>
              </div>
            )}
            
            {/* 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute bottom-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-background/90 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Add to Itinerary
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
                      <span className="truncate">{itin.name}</span>
                      {isInThis && <Check className="w-4 h-4 text-primary ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                {showNewItineraryInput === experience.id ? (
                  <div className="p-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Itinerary name..."
                      value={newItineraryName}
                      onChange={(e) => setNewItineraryName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(experience); }}
                    />
                    <Button size="sm" className="h-8" onClick={() => handleCreateAndAdd(experience)} disabled={!newItineraryName.trim()}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); setShowNewItineraryInput(experience.id); }}
                    className="flex items-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" />
                    Create New Itinerary
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle Add/Remove Button */}
            <button
              onClick={(e) => handleToggleItinerary(experience, e)}
              className={cn(
                "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                inItinerary 
                  ? 'bg-primary text-primary-foreground opacity-100' 
                  : 'bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
              )}
            >
              {inItinerary ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {experience.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {experience.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {experience.location}
              </span>
            )}
            {experience.price && <span>{experience.price}</span>}
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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header - TikTok style */}
        <div 
          className="relative p-4 md:p-6 lg:p-8 pb-6 md:pb-8"
          style={{ background: `linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--background)) 100%)` }}
        >
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 md:mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5 md:gap-8">
            {/* Cover Image - Slightly rounded, TikTok profile style */}
            <div className="w-40 h-52 sm:w-44 sm:h-56 md:w-52 md:h-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              {itinerary.coverImage ? (
                <img src={itinerary.coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">🗺️</span>
                </div>
              )}
            </div>

            {/* Info - TikTok style hierarchy */}
            <div className="flex-1 min-w-0 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Public Itinerary
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 md:mb-4 line-clamp-2">
                {itinerary.name}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground text-[15px]">
                <span className="font-medium">{itinerary.experiences.length} experiences</span>
                {itinerary.creatorName && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    by <span className="text-foreground font-semibold">@{itinerary.creatorName}</span>
                  </span>
                )}
              </div>

              {/* Action Buttons - Inline with info */}
              <div className="flex flex-wrap items-center gap-3 mt-6 md:mt-8">
                {/* Copy Itinerary */}
                <Button onClick={() => setCopyDialogOpen(true)} variant="secondary" className="gap-2 rounded-full px-5 h-11 font-semibold">
                  <Copy className="w-4 h-4" />
                  Copy Itinerary
                </Button>
                
                {/* Share */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full w-11 h-11 border-border/50">
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border-border">
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
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Side: Experiences (60%) */}
          <div className={cn(
            "flex-1 overflow-y-auto border-r border-border",
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
                
                {/* Make it a Trip action with date range */}
                {!showTripView && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {tripStartDate && tripEndDate 
                            ? `${format(tripStartDate, "MMM d")} - ${format(tripEndDate, "MMM d")}`
                            : tripStartDate 
                              ? format(tripStartDate, "MMM d")
                              : "Pick dates"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                {filteredExperiences.map(renderExperienceCard)}
              </div>

              {filteredExperiences.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No experiences found matching "{searchQuery}"</p>
                </div>
              )}

              {/* Related Public Itineraries Section */}
              {relatedItineraries.length > 0 && !showTripView && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Related Itineraries
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {relatedItineraries.map((related) => (
                      <Link 
                        key={related.id} 
                        to={`/public-itinerary/${related.id}`}
                        className="group"
                      >
                        <Card className="overflow-hidden border-0 bg-card/60 hover:bg-card transition-colors">
                          <div className="aspect-video relative overflow-hidden">
                            {related.coverImage ? (
                              <img 
                                src={related.coverImage} 
                                alt={related.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                <span className="text-2xl">🗺️</span>
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-xs">
                              {related.experiences.length} exp
                            </Badge>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {related.name}
                            </h4>
                            {related.creatorName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                by @{related.creatorName}
                              </p>
                            )}
                          </div>
                        </Card>
                      </Link>
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
    </MainLayout>
  );
};

export default PublicItinerary;
