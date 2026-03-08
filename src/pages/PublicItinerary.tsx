import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { allExperiences } from "@/hooks/useExperiencesData";

import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, setHours, setMinutes, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";

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
  Trash2,
  Users,
  UserPlus,
  Send,
  Mail
} from "lucide-react";

// Time slot configurations — emoji labels only, no fixed times
const timeSlotConfig: Record<TimeSlot, { label: string; emoji: string; icon: React.ReactNode }> = {
  morning: { label: "Morning", emoji: "🌅", icon: <Sunrise className="w-3 h-3" /> },
  afternoon: { label: "Afternoon", emoji: "☀️", icon: <Sun className="w-3 h-3" /> },
  evening: { label: "Evening", emoji: "🌆", icon: <Sunset className="w-3 h-3" /> },
  night: { label: "Night", emoji: "🌙", icon: <Moon className="w-3 h-3" /> },
};

const PublicItinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showCollaboratorSheet, setShowCollaboratorSheet] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
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
  const [showTripSelectorSheet, setShowTripSelectorSheet] = useState(false);
  const [showNewTripDatePicker, setShowNewTripDatePicker] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [generatedTrip, setGeneratedTrip] = useState<Record<string, LikedExperience[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomizeSheet, setShowCustomizeSheet] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState("");
  const [activeTripMode, setActiveTripMode] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  
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
    const freq: Record<string, number> = {};
    locations.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [itinerary]);

  // Suggested experiences from the full database (not already in this itinerary)
  const itineraryExpIds = useMemo(() => new Set(itinerary?.experiences.map(e => e.id) || []), [itinerary]);

  const suggestedExperiences = useMemo(() => {
    if (!searchQuery.trim() || !itinerary) return [];
    const q = searchQuery.toLowerCase();
    return allExperiences
      .filter(exp => !itineraryExpIds.has(exp.id))
      .filter(exp =>
        exp.title?.toLowerCase().includes(q) ||
        exp.location?.toLowerCase().includes(q) ||
        exp.category?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [searchQuery, itineraryExpIds, itinerary]);

  // Build a lookup map: experience ID → { day, slot } when in trip mode
  const tripScheduleMap = useMemo(() => {
    if (!activeTripMode || Object.keys(generatedTrip).length === 0) return new Map<string, { day: string; slot: TimeSlot }>();
    const map = new Map<string, { day: string; slot: TimeSlot }>();
    for (const [dayKey, exps] of Object.entries(generatedTrip)) {
      for (const exp of exps) {
        const slot = exp.timeSlot || 'afternoon';
        map.set(exp.id, { day: dayKey, slot });
      }
    }
    return map;
  }, [activeTripMode, generatedTrip]);

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

  // Auto-generate trip based on experiences — assign to dates with time-of-day labels only
  const generateTrip = (startDate: Date, endDate?: Date) => {
    setIsGenerating(true);
    
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
          tripDays[dayKey].push({ ...exp, timeSlot: slot });
        }
      }
      
      // Fill remaining from any slot
      for (const slot of slots) {
        while (bySlot[slot].length > 0 && tripDays[dayKey].length < experiencesPerDay) {
          const exp = bySlot[slot].shift()!;
          tripDays[dayKey].push({ ...exp, timeSlot: slot });
        }
      }
    }
    
    // Any remaining experiences go to the last day
    const lastDayKey = format(addDays(startDate, numDays - 1), "yyyy-MM-dd");
    const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const slot of slots) {
      while (bySlot[slot].length > 0) {
        const exp = bySlot[slot].shift()!;
        tripDays[lastDayKey].push({ ...exp, timeSlot: slot });
      }
    }
    
    setTimeout(() => {
      setGeneratedTrip(tripDays);
      setIsGenerating(false);
      setActiveTripMode(true);
      setShowTripSelectorSheet(false);
      setShowNewTripDatePicker(false);
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

  // Update experience time slot (no fixed times)
  const handleUpdateExperienceSlot = (expId: string, newSlot: TimeSlot) => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      for (const dayKey of Object.keys(updated)) {
        updated[dayKey] = updated[dayKey].map(exp => 
          exp.id === expId ? { ...exp, timeSlot: newSlot } : exp
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
      
      updated[fromDay] = updated[fromDay].filter(e => e.id !== expId);
      if (!updated[toDay]) updated[toDay] = [];
      updated[toDay].push({ ...exp });
      
      return updated;
    });
  };

  const handleExitTripMode = () => {
    setActiveTripMode(false);
    setGeneratedTrip({});
    setTripStartDate(undefined);
    setTripEndDate(undefined);
    setTripName("");
    setActiveTripId(null);
  };

  const handleShare = async () => {
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

  // Handle changing an experience's time slot in trip mode
  const handleChangeTimeSlot = (expId: string, newSlot: TimeSlot) => {
    setGeneratedTrip(prev => {
      const updated = { ...prev };
      for (const dayKey of Object.keys(updated)) {
        updated[dayKey] = updated[dayKey].map(exp => {
          if (exp.id === expId) {
            return { ...exp, timeSlot: newSlot };
          }
          return exp;
        });
      }
      return updated;
    });
  };

  // Render experience card
  const renderExperienceCard = (experience: LikedExperience) => {
    const liked = isItemLiked(experience.id, 'experience');
    const schedule = tripScheduleMap.get(experience.id);
    
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
      >
        <div 
          className="group cursor-pointer transition-transform duration-150"
        >
          {/* Cover Image - match ExperienceCard geometry (4:3, rounded-xl) */}
          <div className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-xl bg-muted",
            activeTripMode && "ring-1 ring-primary/20"
          )}>
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
            {!activeTripMode && (
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
            )}

            {/* Trip mode: date/time badge at bottom of image */}
            {activeTripMode && schedule && (() => {
              const slotInfo = timeSlotConfig[schedule.slot];
              return (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white text-[11px] font-medium">
                      <span>{slotInfo.emoji}</span>
                      <span>{format(new Date(schedule.day), "EEE d")}</span>
                      <span className="opacity-60">·</span>
                      <span className="opacity-80">{slotInfo.label}</span>
                    </div>
                    {/* Change time slot + move day */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="p-1 rounded bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Time of day</div>
                        {(Object.keys(timeSlotConfig) as TimeSlot[]).map((slot) => (
                          <DropdownMenuItem
                            key={slot}
                            onClick={(e) => {
                              e.preventDefault();
                              handleChangeTimeSlot(experience.id, slot);
                            }}
                            className={cn("flex items-center gap-2", schedule.slot === slot && "bg-accent")}
                          >
                            <span>{timeSlotConfig[slot].emoji}</span>
                            <span>{timeSlotConfig[slot].label}</span>
                            {schedule.slot === slot && <Check className="w-3 h-3 ml-auto text-primary" />}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Move to day</div>
                        {Object.keys(generatedTrip).map((dayKey) => (
                          <DropdownMenuItem
                            key={dayKey}
                            onClick={(e) => {
                              e.preventDefault();
                              if (dayKey !== schedule.day) {
                                handleMoveExperienceToDay(experience.id, schedule.day, dayKey);
                              }
                            }}
                            className={cn("flex items-center gap-2", dayKey === schedule.day && "bg-accent")}
                          >
                            <CalendarIcon className="w-3 h-3" />
                            <span>{format(new Date(dayKey), "EEE, MMM d")}</span>
                            {dayKey === schedule.day && <Check className="w-3 h-3 ml-auto text-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })()}
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
        </div>
      </Link>
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
                <DropdownMenuContent align="end" className="bg-popover border-border w-56">
                  <DropdownMenuItem onClick={handleShare}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWhatsApp}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCopyDialogOpen(true)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Itinerary
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowInviteSheet(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Invite Friends
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCollaboratorSheet(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Add Collaborators
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Like button */}
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Experiences */}
          <div className="flex-1 w-full">
            {/* Search Bar + Trip Button */}
            <div className={cn(
              "px-3 md:px-6 py-3 md:py-4 border-b sticky top-0 backdrop-blur-sm z-10 transition-colors",
              activeTripMode 
                ? "bg-primary/5 border-primary/20" 
                : "bg-background/95 border-border"
            )}>
              <div className="flex items-center justify-between gap-3">
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
                  {/* Trip button */}
                  {!activeTripMode ? (
                    <Button className="gap-2" onClick={() => setShowTripSelectorSheet(true)}>
                      <Rocket className="w-4 h-4" />
                      <span className="hidden sm:inline">Make it a</span> Trip
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs"
                        onClick={() => setShowTripSelectorSheet(true)}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {tripStartDate && tripEndDate 
                          ? `${format(tripStartDate, "MMM d")} – ${format(tripEndDate, "MMM d")}`
                          : "Trip"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleExitTripMode}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Trip mode active bar */}
            {activeTripMode && (
              <div className="px-3 md:px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trip mode — experiences auto-assigned by time of day</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-7 text-xs gap-1.5"
                  onClick={handleSaveTrip}
                >
                  <Check className="w-3 h-3" />
                  Save Trip
                </Button>
              </div>
            )}

            {/* Experiences Grid - same size always */}
            <div className={cn("p-3 md:p-6 transition-colors", activeTripMode && "bg-muted/20")}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredExperiences.slice(0, 10).map(renderExperienceCard)}
              </div>

              {filteredExperiences.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No experiences in this itinerary match "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
                </div>
              )}
            </div>
          </div>
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

        {/* Trip Selector Sheet */}
        <Sheet open={showTripSelectorSheet} onOpenChange={setShowTripSelectorSheet}>
          <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <SheetHeader className="pb-3">
              <SheetTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                {showNewTripDatePicker ? "Select dates" : "Trip"}
              </SheetTitle>
              <SheetDescription>
                {showNewTripDatePicker 
                  ? "Pick your travel dates — experiences will be auto-assigned based on their time of day" 
                  : "View existing trips or create a new one"}
              </SheetDescription>
            </SheetHeader>
            
            {!showNewTripDatePicker ? (
              <div className="space-y-3 py-3">
                {/* Existing trips from saved itineraries */}
                {itineraries.filter(i => i.trips && i.trips.length > 0).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your saved trips</p>
                    {itineraries.flatMap(itin => 
                      (itin.trips || []).map((trip: any, idx: number) => (
                        <button
                          key={trip.id || idx}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            activeTripId === trip.id 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-muted/30 border-border hover:bg-muted/50"
                          )}
                          onClick={() => {
                            // Load this trip's schedule
                            if (trip.experiences && trip.startDate) {
                              const tripDays: Record<string, LikedExperience[]> = {};
                              trip.experiences.forEach((exp: LikedExperience) => {
                                if (exp.scheduledTime) {
                                  const dayKey = format(new Date(exp.scheduledTime), "yyyy-MM-dd");
                                  if (!tripDays[dayKey]) tripDays[dayKey] = [];
                                  tripDays[dayKey].push(exp);
                                }
                              });
                              setGeneratedTrip(tripDays);
                              setTripStartDate(new Date(trip.startDate));
                              setTripEndDate(trip.endDate ? new Date(trip.endDate) : undefined);
                              setActiveTripMode(true);
                              setActiveTripId(trip.id);
                              setShowTripSelectorSheet(false);
                            }
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{trip.name || `Trip ${idx + 1}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {trip.startDate && format(new Date(trip.startDate), "MMM d")}
                              {trip.endDate && ` – ${format(new Date(trip.endDate), "MMM d")}`}
                              {trip.experiences && ` · ${trip.experiences.length} experiences`}
                            </p>
                          </div>
                          {activeTripId === trip.id && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* New trip button */}
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                  onClick={() => setShowNewTripDatePicker(true)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-primary">New Trip</p>
                    <p className="text-xs text-muted-foreground">Auto-assign experiences to dates</p>
                  </div>
                </button>

                {/* If already in trip mode, option to exit */}
                {activeTripMode && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => {
                      handleExitTripMode();
                      setShowTripSelectorSheet(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Exit Trip Mode
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-3">
                <Calendar
                  mode="range"
                  selected={{ from: tripStartDate, to: tripEndDate }}
                  onSelect={(range) => {
                    setTripStartDate(range?.from);
                    setTripEndDate(range?.to);
                  }}
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                  numberOfMonths={isMobile ? 1 : 2}
                />
                
                <div className="w-full space-y-3 mt-4 px-2">
                  {tripStartDate && tripEndDate && (
                    <p className="text-sm text-center text-muted-foreground">
                      {format(tripStartDate, "MMM d")} – {format(tripEndDate, "MMM d, yyyy")}
                    </p>
                  )}
                  {tripStartDate && !tripEndDate && (
                    <p className="text-sm text-center text-muted-foreground">
                      Select an end date, or use a single day
                    </p>
                  )}

                  {/* Time slot legend */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(Object.keys(timeSlotConfig) as TimeSlot[]).map((slot) => (
                      <div key={slot} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                        <span>{timeSlotConfig[slot].emoji}</span>
                        <span>{timeSlotConfig[slot].label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowNewTripDatePicker(false)}
                    >
                      Back
                    </Button>
                    <Button 
                      className="flex-1 gap-2"
                      disabled={!tripStartDate}
                      onClick={() => {
                        if (tripStartDate) {
                          generateTrip(tripStartDate, tripEndDate || tripStartDate);
                        }
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {tripStartDate && !tripEndDate 
                        ? `Generate for ${format(tripStartDate, "MMM d")}` 
                        : tripStartDate && tripEndDate 
                          ? "Generate Trip" 
                          : "Select dates"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Invite Friends Sheet */}
        <Sheet open={showInviteSheet} onOpenChange={setShowInviteSheet}>
          <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[60vh]">
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Invite Friends
              </SheetTitle>
              <SheetDescription>Share this itinerary with friends via email</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-muted rounded-lg px-3">
                  <Mail className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <Input
                    type="email"
                    placeholder="friend@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inviteEmail.trim()) {
                        handleShare();
                        toast({ title: "Invite sent!", description: `Link shared with ${inviteEmail}` });
                        setInviteEmail("");
                      }
                    }}
                  />
                </div>
                <Button
                  disabled={!inviteEmail.trim()}
                  onClick={() => {
                    handleShare();
                    toast({ title: "Invite sent!", description: `Link shared with ${inviteEmail}` });
                    setInviteEmail("");
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleShareWhatsApp}>
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Collaborators Sheet */}
        <Sheet open={showCollaboratorSheet} onOpenChange={setShowCollaboratorSheet}>
          <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[60vh]">
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Add Collaborators
              </SheetTitle>
              <SheetDescription>Invite people to edit and plan this trip together</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-muted rounded-lg px-3">
                  <UserPlus className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <Input
                    type="email"
                    placeholder="collaborator@email.com"
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && collaboratorEmail.trim()) {
                        toast({ title: "Collaborator invited!", description: `${collaboratorEmail} will receive an invite to join.` });
                        setCollaboratorEmail("");
                      }
                    }}
                  />
                </div>
                <Button
                  disabled={!collaboratorEmail.trim()}
                  onClick={() => {
                    toast({ title: "Collaborator invited!", description: `${collaboratorEmail} will receive an invite to join.` });
                    setCollaboratorEmail("");
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Collaborators can add experiences, edit the schedule, and help plan the trip.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Wrapper>
  );
};

export default PublicItinerary;
