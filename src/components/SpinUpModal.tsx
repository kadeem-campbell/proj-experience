import { useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { CalendarIcon, Rocket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Itinerary } from "@/hooks/useItineraries";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LikedExperience } from "@/hooks/useLikedExperiences";

interface SpinUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceItinerary: Itinerary;
  onSpinUpComplete?: (newItineraryId: string) => void;
}

export const SpinUpModal = ({ open, onOpenChange, sourceItinerary, onSpinUpComplete }: SpinUpModalProps) => {
  const [date, setDate] = useState<Date>();
  const [isSpinning, setIsSpinning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if source has any dated experiences
  const sourceHasDates = sourceItinerary.experiences.some(e => e.scheduledTime);
  const sourceStartDate = sourceHasDates
    ? new Date(Math.min(...sourceItinerary.experiences
        .filter(e => e.scheduledTime)
        .map(e => new Date(e.scheduledTime!).getTime())))
    : null;

  const handleSpinUp = () => {
    if (!date) return;
    
    setIsSpinning(true);
    
    // Create new itinerary
    const newName = `${sourceItinerary.name} - ${format(date, "MMM d, yyyy")}`;
    
    // Calculate date shift if source has dates
    let shiftedExperiences: LikedExperience[] = [];
    
    if (sourceHasDates && sourceStartDate) {
      // Scenario A: Shift all dates by the difference
      const daysDiff = differenceInDays(date, sourceStartDate);
      
      shiftedExperiences = sourceItinerary.experiences.map(exp => {
        if (exp.scheduledTime) {
          const originalDate = new Date(exp.scheduledTime);
          const newDate = addDays(originalDate, daysDiff);
          return { ...exp, scheduledTime: newDate.toISOString(), likedAt: new Date().toISOString() };
        }
        return { ...exp, likedAt: new Date().toISOString() };
      });
    } else {
      // Scenario B: Source is dateless - create floating items
      shiftedExperiences = sourceItinerary.experiences.map(exp => ({
        ...exp,
        scheduledTime: undefined, // Floating
        likedAt: new Date().toISOString()
      }));
    }
    
    // Create the new itinerary with the shifted experiences
    const generateId = () => Math.random().toString(36).substr(2, 9);
    const newItinerary: Itinerary = {
      id: generateId(),
      name: newName,
      experiences: shiftedExperiences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      collaborators: [],
      coverImage: sourceItinerary.coverImage,
      startDate: date.toISOString()
    };
    
    // Save to localStorage
    const stored = localStorage.getItem('itineraries');
    const current = stored ? JSON.parse(stored) : [];
    const updated = [...current, newItinerary];
    localStorage.setItem('itineraries', JSON.stringify(updated));
    localStorage.setItem('activeItineraryId', newItinerary.id);
    window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: updated }));
    window.dispatchEvent(new CustomEvent('activeItineraryChanged', { detail: newItinerary.id }));
    
    setTimeout(() => {
      setIsSpinning(false);
      onOpenChange(false);
      
      // Call the completion callback with the new ID
      if (onSpinUpComplete) {
        onSpinUpComplete(newItinerary.id);
      }
      
      toast({
        title: "🎉 Trip Created!",
        description: `Your trip starting ${format(date, "MMMM d, yyyy")} is ready to customize.`,
      });
      
      navigate(`/trip/${newItinerary.id}`);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="w-5 h-5 text-primary" />
            Spin Up This Trip
          </DialogTitle>
          <DialogDescription>
            When is your trip happening? We'll create your personal copy with the right dates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Preview of what you're copying */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              {sourceItinerary.coverImage || sourceItinerary.experiences[0]?.videoThumbnail ? (
                <img 
                  src={sourceItinerary.coverImage || sourceItinerary.experiences[0]?.videoThumbnail}
                  alt={sourceItinerary.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{sourceItinerary.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sourceItinerary.experiences.length} experiences
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Trip Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {sourceHasDates && (
            <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
              ✨ This itinerary has scheduled experiences. We'll shift all dates to match your new start date.
            </p>
          )}
          
          {!sourceHasDates && (
            <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
              📋 This is an unscheduled itinerary. You'll be able to drag experiences onto your timeline.
            </p>
          )}
          
          <Button 
            onClick={handleSpinUp} 
            disabled={!date || isSpinning}
            className="w-full h-12 text-base font-semibold"
          >
            {isSpinning ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Creating your trip...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Spin Up Trip
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
