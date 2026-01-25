import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns";
import confetti from "canvas-confetti";
import { 
  Palette, MapPin, Users, Calendar, GripVertical, 
  Clock, ChevronRight, Sparkles, Bell, Rocket, ArrowLeft, Share2,
  Globe, Lock, Download, FileSpreadsheet, Settings,
  MessageCircle, Copy, Check, Plus, Trash2, Edit2, Camera, X,
  DollarSign, Timer, MoreVertical, Eye, Zap, LayoutGrid, CalendarDays,
  Link2, Mail, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Itinerary, useItineraries } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { SpinUpModal } from "@/components/SpinUpModal";
import { publicItinerariesData } from "@/data/itinerariesData";
import { useToast } from "@/hooks/use-toast";
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

interface TripPageProps {
  useActiveItinerary?: boolean;
}

export default function Trip({ useActiveItinerary = false }: TripPageProps) {
  const { id } = useParams();
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
  } = useItineraries();

  // Determine which itinerary to show
  const [loadedItinerary, setLoadedItinerary] = useState<Itinerary | null>(null);
  
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

  // Check if user owns this itinerary
  const isOwner = useMemo(() => {
    if (useActiveItinerary) return true;
    if (!itinerary) return false;
    return itineraries.some(i => i.id === itinerary.id);
  }, [useActiveItinerary, itinerary, itineraries]);

  // View state: "experiences" or "planning"
  const [viewMode, setViewMode] = useState<"experiences" | "planning">("experiences");
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
  const [viewingExperienceId, setViewingExperienceId] = useState<string | null>(null);
  const [justSpunUp, setJustSpunUp] = useState(false);

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

  // Load itinerary from localStorage if not in hook
  useEffect(() => {
    if (!useActiveItinerary && id && !itineraries.find(i => i.id === id)) {
      const stored = localStorage.getItem('itineraries');
      if (stored) {
        const all: Itinerary[] = JSON.parse(stored);
        const found = all.find(i => i.id === id);
        if (found) setLoadedItinerary(found);
      }
    }
  }, [id, itineraries, useActiveItinerary]);

  // Load theme from itinerary
  useEffect(() => {
    if (itinerary && (itinerary as any).theme) {
      setCurrentTheme((itinerary as any).theme as ThemeKey);
    }
  }, [itinerary]);

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

  // Get related public itineraries for discovery
  const relatedItineraries = useMemo(() => {
    if (!itinerary) return [];
    return publicItinerariesData
      .filter(i => i.experiences.some(e => 
        itinerary.experiences.some(ie => ie.location === e.location)
      ))
      .slice(0, 4);
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

  // Handle drag and drop for timeline (Owner only)
  const handleDragStart = (exp: LikedExperience) => {
    if (!isOwner) return;
    setDraggedItem(exp);
  };

  const handleDrop = (dayStr: string) => {
    if (!draggedItem || !itinerary || !isOwner) return;
    
    const newDate = new Date(dayStr);
    newDate.setHours(9, 0, 0, 0);
    
    updateExperienceDetails(draggedItem.id, { scheduledTime: newDate.toISOString() });
    setDraggedItem(null);
    toast({ title: "Scheduled!", description: `Added to ${format(newDate, "EEEE, MMM d")}` });
  };

  const handleSubscribe = () => {
    if (email) {
      toast({ title: "Subscribed!", description: "You'll get updates when this trip changes." });
      setEmail("");
    }
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

  const viewingExperience = viewingExperienceId
    ? itinerary?.experiences.find(e => e.id === viewingExperienceId)
    : null;

  // Mock creator name
  const creatorName = itinerary?.collaborators[0]?.split('@')[0] || 'traveler';

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No itinerary found</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = (itinerary as any).startDate 
    ? format(parseISO((itinerary as any).startDate), "MMMM d, yyyy")
    : "Dates TBD";

  const locations = [...new Set(itinerary.experiences.map(e => e.location))].slice(0, 3);
  const shareUrl = getShareUrl(itinerary.id);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className={cn(
        "fixed inset-0 bg-gradient-to-br transition-all duration-700",
        theme.gradient
      )} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background))_70%)]" />
      
      {/* Just Spun Up celebration banner */}
      {justSpunUp && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary/90 to-primary p-3 text-center animate-fade-in">
          <p className="text-primary-foreground font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Welcome to your trip! You can now edit, organize, and make it yours.
            <Sparkles className="w-4 h-4" />
          </p>
        </div>
      )}
      
      {/* Content */}
      <div className={cn("relative z-10 max-w-7xl mx-auto px-4 py-6", justSpunUp && "pt-16")}>
        
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                {/* Customize Button - Opens Sheet */}
                <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
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

                      {/* Cover Photo */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Cover Photo
                        </label>
                        <div 
                          className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                          onClick={handleCoverImageClick}
                        >
                          {itinerary.coverImage ? (
                            <img src={itinerary.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to upload</p>
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

                <Button size="sm" onClick={handleCopyLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                {/* Big pulsing Spin Up button for viewers */}
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
              </>
            )}
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl md:text-3xl font-bold h-auto py-1 bg-muted"
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
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
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
                {!isOwner && (
                  <Badge variant="secondary" className="bg-muted">
                    <Eye className="w-3 h-3 mr-1" />
                    @{creatorName}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {startDate}
            </span>
            {locations.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {locations.join(" → ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              ~${totalPrice.toFixed(0)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              ~{formatDuration(totalDuration)}
            </span>
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
          </div>
        </div>

        {/* View Toggle - Experiences vs Planning - Always show for personal itineraries */}
        <div className="mb-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "experiences" | "planning")}>
            <TabsList className="bg-card/60 backdrop-blur-sm">
              <TabsTrigger value="experiences" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Experiences
              </TabsTrigger>
              <TabsTrigger value="planning" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Planning
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content - Conditional based on viewMode */}
        {viewMode === "experiences" ? (
          /* Experiences View - Clean List */
          <div className="max-w-4xl">
            <Card className="rounded-2xl border-0 bg-card/40 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className={cn("w-5 h-5", theme.accent)} />
                  {itinerary.experiences.length} Experiences
                </h3>
                {isOwner && (
                  <Link to="/">
                    <Button variant="ghost" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </Link>
                )}
              </div>
              
              {itinerary.experiences.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm mb-4">
                    {isOwner ? "No experiences yet" : "This trip is empty"}
                  </p>
                  {isOwner && (
                    <Link to="/">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Discover
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {itinerary.experiences.map((exp) => (
                    <Link 
                      key={exp.id}
                      to={`/experience/${exp.id}`}
                      className="block"
                    >
                      <div 
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-background/40 transition-all group hover:bg-background/60"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {exp.videoThumbnail ? (
                            <img src={exp.videoThumbnail} alt={exp.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exp.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{exp.location}</p>
                          {exp.price && (
                            <p className="text-sm text-muted-foreground mt-1">{exp.price}</p>
                          )}
                        </div>
                        
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingExperienceId(exp.id);
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
                                  handleRemoveExperience(exp);
                                }}
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Planning View - Timeline with Map and Who's Going */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Timeline */}
            <div className="lg:col-span-8">
              <Card className="rounded-2xl border-0 bg-card/40 backdrop-blur-xl p-5">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className={cn("w-5 h-5", theme.accent)} />
                  <h3 className="font-semibold text-lg">Schedule</h3>
                  {isOwner && (
                    <Badge variant="outline" className="text-xs">
                      Drag experiences to schedule
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tripDays.slice(0, 4).map((dayStr, idx) => {
                    const dayExperiences = scheduledByDay[dayStr] || [];
                    const dayDate = parseISO(dayStr);
                    const isToday = isSameDay(dayDate, new Date());
                    
                    return (
                      <div 
                        key={dayStr}
                        onDragOver={(e) => { if (isOwner) { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary', 'bg-primary/5'); } }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/5'); }}
                        onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/5'); handleDrop(dayStr); }}
                        className={cn(
                          "p-4 rounded-xl border transition-all min-h-[200px]",
                          dayExperiences.length === 0
                            ? "border-dashed border-border/50" 
                            : "border-border/30 bg-background/40"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                            isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{format(dayDate, "EEE")}</p>
                            <p className="text-xs text-muted-foreground">{format(dayDate, "MMM d")}</p>
                          </div>
                        </div>
                        
                        {dayExperiences.length > 0 ? (
                          <div className="space-y-2">
                            {dayExperiences.map(exp => (
                              <div key={exp.id} className="text-xs p-2 bg-card/60 rounded-lg border border-border/30">
                                <p className="font-medium truncate">{exp.title}</p>
                                {exp.scheduledTime && (
                                  <p className="text-muted-foreground">
                                    {format(parseISO(exp.scheduledTime), "h:mm a")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic text-center py-8">
                            {isOwner ? "Drag ideas here" : "No plans yet"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Unscheduled experiences for dragging */}
                {isOwner && unscheduled.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border/30">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <GripVertical className="w-4 h-4" />
                      Ideas to Place ({unscheduled.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {unscheduled.map(exp => (
                        <div 
                          key={exp.id}
                          draggable
                          onDragStart={() => handleDragStart(exp)}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-background/40 cursor-grab active:cursor-grabbing"
                        >
                          <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                            {exp.videoThumbnail ? (
                              <img src={exp.videoThumbnail} alt={exp.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <MapPin className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium truncate max-w-[100px]">{exp.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Map + Who's Going */}
            <div className="lg:col-span-4 space-y-6">
              {/* Map */}
              <Card className="rounded-2xl border-0 bg-card/40 backdrop-blur-xl overflow-hidden min-h-[200px]">
                <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30">
                  <MapPin className={cn("w-8 h-8 mb-2", theme.accent)} />
                  <p className="font-medium text-sm mb-1">Trip Map</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {itinerary.experiences.length} locations
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                    View Map <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>

              {/* Who's Going */}
              <Card className="rounded-2xl border-0 bg-card/40 backdrop-blur-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className={cn("w-5 h-5", theme.accent)} />
                  <h3 className="font-semibold">Who's Going</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-sm font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  {itinerary.collaborators.map((collab) => (
                    <div 
                      key={collab}
                      className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
                      title={collab}
                    >
                      {collab[0].toUpperCase()}
                    </div>
                  ))}
                  {isOwner && (
                    <button
                      onClick={() => setCustomizeOpen(true)}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {3 + itinerary.collaborators.length} people on this trip
                </p>

                {isOwner && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setCustomizeOpen(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Friends
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Showroom Mode: Viewer Banner & CTA */}
        {!isOwner && (
          <>
            {/* Sticky bottom banner */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
              <div className="max-w-7xl mx-auto px-4 pb-4">
                <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        You're viewing @{creatorName}'s trip
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Spin it up to make it yours
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setSpinUpOpen(true)} className="shrink-0">
                    <Rocket className="w-4 h-4 mr-2" />
                    Spin Up
                  </Button>
                </div>
              </div>
            </div>

            {/* Viral Footer */}
            <div className="mt-16 mb-24 text-center">
              <div className="max-w-md mx-auto p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/30">
                <Sparkles className={cn("w-8 h-8 mx-auto mb-4", theme.accent)} />
                <h3 className="text-xl font-semibold mb-2">Inspired by this trip?</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Create your own version with your dates.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-base font-semibold"
                    onClick={() => setSpinUpOpen(true)}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Spin Up Your Own
                  </Button>
                  
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 bg-background/60"
                    />
                    <Button variant="secondary" onClick={handleSubscribe}>
                      <Bell className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Get notified when this trip updates</p>
                </div>
              </div>

              {/* Related Public Itineraries */}
              {relatedItineraries.length > 0 && (
                <div className="mt-12 text-left">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className={cn("w-5 h-5", theme.accent)} />
                    Explore Similar Itineraries
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {relatedItineraries.map((related) => (
                      <Link key={related.id} to={`/public-itinerary/${related.id}`}>
                        <Card className="overflow-hidden border-0 bg-card/60 hover:bg-card transition-colors group">
                          <div className="aspect-video relative overflow-hidden">
                            {related.coverImage ? (
                              <img src={related.coverImage} alt={related.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">🗺️</div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="font-medium text-xs truncate">{related.name}</p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Spin Up Modal */}
      <SpinUpModal 
        open={spinUpOpen} 
        onOpenChange={setSpinUpOpen} 
        sourceItinerary={itinerary}
        onSpinUpComplete={handleSpinUpComplete}
      />

      {/* Edit Experience Dialog */}
      <Dialog open={!!editingExperienceId} onOpenChange={(open) => !open && setEditingExperienceId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Experience</DialogTitle>
            <DialogDescription>Add notes and schedule a time</DialogDescription>
          </DialogHeader>
          
          {editingExperience && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                  {editingExperience.videoThumbnail ? (
                    <img 
                      src={editingExperience.videoThumbnail} 
                      alt={editingExperience.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{editingExperience.title}</h3>
                  <p className="text-sm text-muted-foreground">{editingExperience.location}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled Time
                </label>
                <Input
                  type="datetime-local"
                  value={editingExperience.scheduledTime?.includes('T') 
                    ? editingExperience.scheduledTime.slice(0, 16)
                    : ''}
                  onChange={(e) => updateExperienceDetails(editingExperience.id, { scheduledTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Notes
                </label>
                <Textarea
                  value={editingExperience.notes || ''}
                  onChange={(e) => updateExperienceDetails(editingExperience.id, { notes: e.target.value })}
                  placeholder="Add notes for this experience..."
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  setEditingExperienceId(null);
                  toast({ title: "Saved!" });
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Showroom Mode: View-only Experience Dialog */}
      <Dialog open={!!viewingExperienceId} onOpenChange={(open) => !open && setViewingExperienceId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Experience Details</DialogTitle>
          </DialogHeader>
          
          {viewingExperience && (
            <div className="space-y-4 pt-2">
              <div className="aspect-video rounded-xl overflow-hidden">
                {viewingExperience.videoThumbnail ? (
                  <img 
                    src={viewingExperience.videoThumbnail} 
                    alt={viewingExperience.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-primary/60" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{viewingExperience.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {viewingExperience.location}
                </p>
              </div>

              {viewingExperience.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm italic">"{viewingExperience.notes}"</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{viewingExperience.price || 'Free'}</span>
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  setViewingExperienceId(null);
                  setSpinUpOpen(true);
                }}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Spin Up to Add This
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
