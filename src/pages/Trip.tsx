import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns";
import { 
  Palette, MapPin, Users, Calendar, GripVertical, 
  Clock, ChevronRight, Sparkles, Bell, Rocket, ArrowLeft, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Itinerary } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { SpinUpModal } from "@/components/SpinUpModal";
import { useToast } from "@/hooks/use-toast";

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

export default function Trip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("ocean");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [spinUpOpen, setSpinUpOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [draggedItem, setDraggedItem] = useState<LikedExperience | null>(null);

  const theme = themes[currentTheme];

  // Load itinerary
  useEffect(() => {
    const stored = localStorage.getItem('itineraries');
    if (stored && id) {
      const all: Itinerary[] = JSON.parse(stored);
      const found = all.find(i => i.id === id);
      if (found) setItinerary(found);
    }
  }, [id]);

  // Group experiences by date
  const { scheduledByDay, unscheduled, tripDays } = useMemo(() => {
    if (!itinerary) return { scheduledByDay: {}, unscheduled: [], tripDays: [] };
    
    const scheduled: Record<string, LikedExperience[]> = {};
    const floating: LikedExperience[] = [];
    
    itinerary.experiences.forEach(exp => {
      if (exp.scheduledTime) {
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

  // Handle drag and drop
  const handleDragStart = (exp: LikedExperience) => {
    setDraggedItem(exp);
  };

  const handleDrop = (dayStr: string) => {
    if (!draggedItem || !itinerary) return;
    
    // Update experience with new date
    const newDate = new Date(dayStr);
    newDate.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const updatedExperiences = itinerary.experiences.map(exp => 
      exp.id === draggedItem.id 
        ? { ...exp, scheduledTime: newDate.toISOString() }
        : exp
    );
    
    const updated = { ...itinerary, experiences: updatedExperiences };
    setItinerary(updated);
    
    // Save to localStorage
    const stored = localStorage.getItem('itineraries');
    if (stored) {
      const all: Itinerary[] = JSON.parse(stored);
      const newAll = all.map(i => i.id === id ? updated : i);
      localStorage.setItem('itineraries', JSON.stringify(newAll));
    }
    
    setDraggedItem(null);
    toast({ title: "Experience scheduled!", description: `Added to ${format(newDate, "EEEE, MMM d")}` });
  };

  const handleSubscribe = () => {
    if (email) {
      toast({ title: "Subscribed!", description: "You'll get updates when this trip changes." });
      setEmail("");
    }
  };

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
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
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* Block 1: Hero - Full width on mobile, spans 2 cols on desktop */}
          <Card className="md:col-span-2 relative overflow-hidden rounded-3xl border-0 bg-card/40 backdrop-blur-xl">
            <div className="aspect-[16/9] relative">
              {itinerary.coverImage ? (
                <img 
                  src={itinerary.coverImage} 
                  alt={itinerary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={cn("w-full h-full bg-gradient-to-br", theme.gradient)} />
              )}
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                  {itinerary.name}
                </h1>
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
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs text-muted-foreground">
                +3
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-full">
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
                    draggable
                    onDragStart={() => handleDragStart(exp)}
                    className="flex-shrink-0 w-48 p-3 bg-background/60 rounded-xl border border-border/50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{exp.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{exp.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Block 5: Timeline - Full width */}
          <Card className="md:col-span-3 rounded-3xl border-0 bg-card/40 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className={cn("w-5 h-5", theme.accent)} />
              <h3 className="font-semibold text-lg">Your Timeline</h3>
            </div>
            
            <div className="space-y-6">
              {tripDays.map((dayStr, idx) => {
                const dayExperiences = scheduledByDay[dayStr] || [];
                const dayDate = parseISO(dayStr);
                const isToday = isSameDay(dayDate, new Date());
                
                return (
                  <div 
                    key={dayStr}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary'); handleDrop(dayStr); }}
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
                          <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/30">
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground ml-12">
                        Drop experiences here to schedule
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        
        {/* Viral Footer */}
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
      </div>
      
      {/* Spin Up Modal */}
      <SpinUpModal 
        open={spinUpOpen} 
        onOpenChange={setSpinUpOpen} 
        sourceItinerary={itinerary} 
      />
    </div>
  );
}
