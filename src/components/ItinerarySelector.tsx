import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";

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
  children?: React.ReactNode;
}

export const ItinerarySelector = ({ 
  experienceId, 
  experienceData,
  onAdd,
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
    addExperienceToItinerary
  } = useItineraries();

  const handleAddToItinerary = (itinerary: Itinerary) => {
    setActiveItinerary(itinerary.id);
    addExperienceToItinerary(itinerary.id, experienceData);
    onAdd?.();
    setOpen(false);
  };

  const handleCreateAndAdd = () => {
    if (!newName.trim()) return;
    const newItinerary = createItinerary(newName.trim());
    addExperienceToItinerary(newItinerary.id, experienceData);
    onAdd?.();
    setNewName("");
    setShowNewInput(false);
    setOpen(false);
  };

  // Check how many times this experience is in an itinerary
  const countInItinerary = (itineraryId: string) => {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    return itinerary?.experiences.filter(e => e.id === experienceId).length || 0;
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
          <h4 className="font-semibold text-sm">Add to itinerary</h4>
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {itineraries.map((itinerary) => {
            const count = countInItinerary(itinerary.id);
            return (
              <button
                key={itinerary.id}
                onClick={() => handleAddToItinerary(itinerary)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted"
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
                {count > 0 && (
                  <span className="text-xs text-primary font-medium flex-shrink-0">
                    +{count} added
                  </span>
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
