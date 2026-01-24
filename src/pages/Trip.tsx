import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns";
import { 
  Palette, MapPin, Users, Calendar, GripVertical, 
  Clock, ChevronRight, Sparkles, Bell, Rocket, ArrowLeft, Share2,
  Globe, Lock, Download, FileText, FileSpreadsheet, StickyNote,
  MessageCircle, Copy, Check, Plus, Trash2, Edit2, Camera, X,
  DollarSign, Timer, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Itinerary, useItineraries } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { SpinUpModal } from "@/components/SpinUpModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Theme configurations
const themes = {
  sunset: {
    name: "Sunset",
    gradient: "from-orange-500/30 via-pink-500/20 to-purple-600/30",
    accent: "text-orange-400",
    glow: "bg-orange-500/20"
  },
  ocean: {
    name: "Ocean",
    gradient: "from-cyan-500/30 via-blue-500/20 to-indigo-600/30",
    accent: "text-cyan-400",
    glow: "bg-cyan-500/20"
  },
  midnight: {
    name: "Midnight",
    gradient: "from-slate-800/50 via-purple-900/30 to-slate-900/50",
    accent: "text-purple-400",
    glow: "bg-purple-500/20"
  },
  forest: {
    name: "Forest",
    gradient: "from-emerald-600/30 via-teal-500/20 to-green-700/30",
    accent: "text-emerald-400",
    glow: "bg-emerald-500/20"
  },
  ember: {
    name: "Ember",
    gradient: "from-red-600/30 via-orange-500/20 to-amber-500/30",
    accent: "text-red-400",
    glow: "bg-red-500/20"
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
    reorderExperiences
  } = useItineraries();

  // Determine which itinerary to show
  const [loadedItinerary, setLoadedItinerary] = useState<Itinerary | null>(null);
  
  const itinerary = useMemo(() => {
    if (useActiveItinerary) {
      return activeItinerary;
    }
    // Find by ID from the hook's itineraries first
    const fromHook = itineraries.find(i => i.id === id);
    if (fromHook) return fromHook;
    return loadedItinerary;
  }, [useActiveItinerary, activeItinerary, itineraries, id, loadedItinerary]);

  // Check if user owns this itinerary
  const isOwner = useMemo(() => {
    if (useActiveItinerary) return true;
    if (!itinerary) return false;
    // Check if this itinerary exists in the user's list
    return itineraries.some(i => i.id === itinerary.id);
  }, [useActiveItinerary, itinerary, itineraries]);

  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("ocean");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [spinUpOpen, setSpinUpOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [draggedItem, setDraggedItem] = useState<LikedExperience | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);

  const theme = themes[currentTheme];

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

  // Group experiences by date
  const { scheduledByDay, unscheduled, tripDays } = useMemo(() => {
    if (!itinerary) return { scheduledByDay: {}, unscheduled: [], tripDays: [] };
    
    const scheduled: Record<string, LikedExperience[]> = {};
    const floating: LikedExperience[] = [];
    
    itinerary.experiences.forEach(exp => {
      if (exp.scheduledTime && exp.scheduledTime.includes('-')) {
        // Full ISO date
        const day = format(parseISO(exp.scheduledTime), "yyyy-MM-dd");
        if (!scheduled[day]) scheduled[day] = [];
        scheduled[day].push(exp);
      } else {
        floating.push(exp);
      }
    });
    
    // Sort each day's experiences by time
    Object.keys(scheduled).forEach(day => {
      scheduled[day].sort((a, b) => 
        new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
      );
    });
    
    // Generate trip days from start date
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

  // Handle drag and drop for timeline
  const handleDragStart = (exp: LikedExperience) => {
    setDraggedItem(exp);
  };

  const handleDrop = (dayStr: string) => {
    if (!draggedItem || !itinerary || !isOwner) return;
    
    const newDate = new Date(dayStr);
    newDate.setHours(9, 0, 0, 0);
    
    updateExperienceDetails(draggedItem.id, { scheduledTime: newDate.toISOString() });
    setDraggedItem(null);
    toast({ title: "Experience scheduled!", description: `Added to ${format(newDate, "EEEE, MMM d")}` });
  };

  const handleSubscribe = () => {
    if (email) {
      toast({ title: "Subscribed!", description: "You'll get updates when this trip changes." });
      setEmail("");
    }
  };

  // Owner actions
  const handleStartEditName = () => {
    if (!itinerary) return;
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
        toast({ title: "Cover updated!", description: "Your itinerary cover has been changed" });
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
    toast({ title: "Link copied!", description: "Share this link with your friends" });
  };

  const handleShareWhatsApp = () => {
    if (!itinerary) return;
    const shareUrl = getShareUrl(itinerary.id);
    const text = `Check out my trip: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddCollaborator = () => {
    if (collaboratorEmail.trim() && itinerary) {
      addCollaborator(itinerary.id, collaboratorEmail.trim());
      setCollaboratorEmail("");
      toast({
        title: "Collaborator added",
        description: `${collaboratorEmail} can now view this itinerary`,
      });
    }
  };

  const handleRemoveExperience = (experience: LikedExperience) => {
    removeExperience(experience.id);
    toast({
      title: "Removed",
      description: `${experience.title} has been removed.`,
    });
  };

  const handleExportCSV = () => {
    if (!itinerary) return;
    const headers = ['#', 'Title', 'Category', 'Location', 'Price', 'Scheduled Time', 'Notes', 'Creator'];
    const rows = itinerary.experiences.map((exp, i) => [
      i + 1, exp.title, exp.category || '', exp.location || '', exp.price || '',
      exp.scheduledTime || '', exp.notes || '', exp.creator || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itinerary.name.replace(/\s+/g, '_')}_trip.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "CSV file downloaded" });
  };

  const editingExperience = editingExperienceId 
    ? itinerary?.experiences.find(e => e.id === editingExperienceId)
    : null;

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className={cn(
        "fixed inset-0 bg-gradient-to-br transition-all duration-700",
        theme.gradient
      )} />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background))_70%)]" />
      
      {/* Floating theme picker */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {showThemePicker && (
            <div className="absolute bottom-14 right-0 p-3 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl animate-fade-in">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Theme</p>
              <div className="flex gap-2">
                {(Object.keys(themes) as ThemeKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setCurrentTheme(key); setShowThemePicker(false); }}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      `bg-gradient-to-br ${themes[key].gradient}`,
                      currentTheme === key ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "hover:scale-110"
                    )}
                    title={themes[key].name}
                  />
                ))}
              </div>
            </div>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-12 h-12 shadow-lg bg-card/80 backdrop-blur-sm hover:bg-card"
            onClick={() => setShowThemePicker(!showThemePicker)}
          >
            <Palette className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Visibility Toggle */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => togglePublic(itinerary.id)}
                >
                  {itinerary.isPublic ? <Globe className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {itinerary.isPublic ? 'Public' : 'Private'}
                </Button>
              </>
            )}
            
            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Trip</DialogTitle>
                  <DialogDescription>Share this trip with friends and family</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Public Link</label>
                    <div className="flex gap-2">
                      <Input value={getShareUrl(itinerary.id)} readOnly className="text-sm" />
                      <Button onClick={handleCopyLink}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
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
                  
                  {isOwner && (
                    <div className="space-y-2 pt-4 border-t">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Add Collaborators
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Email address"
                          value={collaboratorEmail}
                          onChange={(e) => setCollaboratorEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
                        />
                        <Button onClick={handleAddCollaborator}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {itinerary.collaborators.length > 0 && (
                        <div className="space-y-1 mt-2">
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
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* Block 1: Hero */}
          <Card className="md:col-span-2 relative overflow-hidden rounded-3xl border-0 bg-card/40 backdrop-blur-xl">
            <div 
              className={cn("aspect-[16/9] relative", isOwner && "cursor-pointer group")}
              onClick={handleCoverImageClick}
            >
              {itinerary.coverImage ? (
                <img 
                  src={itinerary.coverImage} 
                  alt={itinerary.name}
                  className="w-full h-full object-cover"
                />
              ) : itinerary.experiences[0]?.videoThumbnail ? (
                <img 
                  src={itinerary.experiences[0].videoThumbnail} 
                  alt={itinerary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={cn("w-full h-full bg-gradient-to-br", theme.gradient)} />
              )}
              
              {/* Cover change overlay */}
              {isOwner && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl md:text-4xl font-bold bg-white/10 border-white/30 text-white h-auto py-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <Button size="icon" variant="secondary" onClick={handleSaveName}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3 group/name">
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                      {itinerary.name}
                    </h1>
                    {isOwner && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="opacity-0 group-hover/name:opacity-100 transition-opacity h-8 w-8"
                        onClick={handleStartEditName}
                      >
                        <Edit2 className="w-4 h-4 text-white" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 text-white/80">
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
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-white/60 text-sm">
                  <span>{itinerary.experiences.length} experiences</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ~${totalPrice.toFixed(0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    ~{formatDuration(totalDuration)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Block 2: Map Preview */}
          <Card className="rounded-3xl border-0 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="aspect-square md:aspect-auto md:h-full relative bg-muted/50 flex items-center justify-center">
              <div className="text-center p-6">
                <MapPin className={cn("w-12 h-12 mx-auto mb-3", theme.accent)} />
                <p className="text-sm text-muted-foreground">
                  {itinerary.experiences.length} locations
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/map')}>
                  View Map <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Block 3: Attendees */}
          <Card className="rounded-3xl border-0 bg-card/40 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className={cn("w-5 h-5", theme.accent)} />
              <h3 className="font-semibold">Who's Going</h3>
            </div>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 border-2 border-card flex items-center justify-center text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              {itinerary.collaborators.length > 0 && (
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs text-muted-foreground">
                  +{itinerary.collaborators.length}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => setShareDialogOpen(true)}>
              Invite Friends
            </Button>
          </Card>
          
          {/* Block 4: Unscheduled / Ideas Tray */}
          {unscheduled.length > 0 && (
            <Card className="md:col-span-2 rounded-3xl border-0 bg-card/40 backdrop-blur-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className={cn("w-5 h-5", theme.accent)} />
                <h3 className="font-semibold">Ideas to Place</h3>
                <span className="text-xs text-muted-foreground">Drag to timeline</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {unscheduled.map(exp => (
                  <div
                    key={exp.id}
                    draggable={isOwner}
                    onDragStart={() => isOwner && handleDragStart(exp)}
                    className={cn(
                      "flex-shrink-0 w-48 p-3 bg-background/60 rounded-xl border border-border/50 transition-colors",
                      isOwner && "cursor-grab active:cursor-grabbing hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isOwner && <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{exp.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{exp.location}</p>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-destructive opacity-0 hover:opacity-100"
                          onClick={() => handleRemoveExperience(exp)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Block 5: Timeline */}
          <Card className="md:col-span-3 rounded-3xl border-0 bg-card/40 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className={cn("w-5 h-5", theme.accent)} />
              <h3 className="font-semibold text-lg">Your Timeline</h3>
            </div>
            
            {itinerary.experiences.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h2 className="text-xl font-semibold mb-2">Your trip is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Start exploring and add experiences to build your perfect trip!
                </p>
                <Link to="/">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Discover Experiences
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {tripDays.map((dayStr, idx) => {
                  const dayExperiences = scheduledByDay[dayStr] || [];
                  const dayDate = parseISO(dayStr);
                  const isToday = isSameDay(dayDate, new Date());
                  
                  return (
                    <div 
                      key={dayStr}
                      onDragOver={isOwner ? (e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary'); } : undefined}
                      onDragLeave={isOwner ? (e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary'); } : undefined}
                      onDrop={isOwner ? (e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary'); handleDrop(dayStr); } : undefined}
                      className="p-4 rounded-xl bg-background/40 border border-border/30 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                          isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{format(dayDate, "EEEE")}</p>
                          <p className="text-xs text-muted-foreground">{format(dayDate, "MMMM d, yyyy")}</p>
                        </div>
                        {isToday && (
                          <span className="ml-auto px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                            Today
                          </span>
                        )}
                      </div>
                      
                      {dayExperiences.length > 0 ? (
                        <div className="space-y-2 ml-12">
                          {dayExperiences.map(exp => (
                            <Link key={exp.id} to={`/experience/${exp.id}`}>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/30 hover:bg-card/80 transition-colors group">
                                <img 
                                  src={exp.videoThumbnail} 
                                  alt={exp.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">{exp.title}</p>
                                  <p className="text-xs text-muted-foreground">{exp.location}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {exp.scheduledTime && format(parseISO(exp.scheduledTime), "h:mm a")}
                                </span>
                                {isOwner && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setEditingExperienceId(exp.id);
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleRemoveExperience(exp);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground ml-12">
                          {isOwner ? "Drop experiences here to schedule" : "No activities planned"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
        
        {/* Viral Footer - only show for non-owners */}
        {!isOwner && (
          <div className="mt-16 mb-8 text-center">
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
          </div>
        )}
      </div>
      
      {/* Spin Up Modal */}
      <SpinUpModal 
        open={spinUpOpen} 
        onOpenChange={setSpinUpOpen} 
        sourceItinerary={itinerary} 
      />

      {/* Edit Experience Dialog */}
      <Dialog open={!!editingExperienceId} onOpenChange={(open) => !open && setEditingExperienceId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plan Experience</DialogTitle>
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
                  type="time"
                  value={editingExperience.scheduledTime?.includes('T') 
                    ? format(parseISO(editingExperience.scheduledTime), 'HH:mm')
                    : editingExperience.scheduledTime || ''}
                  onChange={(e) => updateExperienceDetails(editingExperience.id, { scheduledTime: e.target.value })}
                  placeholder="e.g., 09:00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
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
                  toast({ title: "Saved!", description: "Experience details updated" });
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
