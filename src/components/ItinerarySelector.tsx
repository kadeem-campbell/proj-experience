import { useState } from "react";
import { Plus, ChevronDown, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ItinerarySelectorProps {
  experienceId: string;
  experienceData: {
    id: string;
    title: string;
    creator: string;
    videoThumbnail: string;
    category: string;
    location: string;
    price: string;
  };
  onAdd?: () => void;
  onRemove?: () => void;
  children?: React.ReactNode;
}

export const ItinerarySelector = ({ 
  experienceId, 
  experienceData,
  onAdd,
  onRemove,
  children 
}: ItinerarySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  
  const { 
    itineraries, 
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    addExperienceToItinerary,
    removeExperienceFromItinerary
  } = useItineraries();

  const handleToggleItinerary = (itinerary: Itinerary) => {
    const alreadyAdded = isInItinerary(itinerary.id);
    
    if (alreadyAdded) {
      // Remove from itinerary
      removeExperienceFromItinerary(itinerary.id, experienceId);
      onRemove?.();
      toast.success(`Removed from "${itinerary.name}"`);
    } else {
      // Add to itinerary
      const result = addExperienceToItinerary(itinerary.id, experienceData);
      
      if (result.alreadyExists) {
        toast.error(`Already in "${itinerary.name}"`, {
          description: "This experience is already in this itinerary"
        });
        return;
      }
      
      setActiveItinerary(itinerary.id);
      onAdd?.();
      toast.success(`Added to "${itinerary.name}"`);
    }
    setOpen(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    const newItinerary = await createItinerary(newName.trim());
    await addExperienceToItinerary(newItinerary.id, experienceData);
    onAdd?.();
    setNewName("");
    setShowNewInput(false);
    setOpen(false);
  };

  // Check if this experience is already in an itinerary
  const isInItinerary = (itineraryId: string) => {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    return itinerary?.experiences.some(e => e.id === experienceId) || false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button 
            size="icon" 
            className="rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-card border-border shadow-xl z-50"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Manage itineraries</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Tap to add or remove</p>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {itineraries.map((itinerary) => {
            const alreadyAdded = isInItinerary(itinerary.id);
            return (
              <button
                key={itinerary.id}
                onClick={() => handleToggleItinerary(itinerary)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted",
                  alreadyAdded && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    itinerary.id === activeItineraryId ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                  <span className="text-sm truncate">{itinerary.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({itinerary.experiences.length})
                  </span>
                </div>
                {alreadyAdded ? (
                  <Minus className="w-4 h-4 text-destructive flex-shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border p-2">
          {showNewInput ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Itinerary name"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateAndAdd();
                  if (e.key === 'Escape') {
                    setShowNewInput(false);
                    setNewName("");
                  }
                }}
              />
              <Button 
                size="sm" 
                className="h-8 px-3"
                onClick={handleCreateAndAdd}
                disabled={!newName.trim()}
              >
                Add
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new itinerary
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
