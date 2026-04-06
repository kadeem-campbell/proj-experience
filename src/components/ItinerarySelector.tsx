import { useState, useEffect, useRef } from "react";
import { Plus, Check, Minus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  
  const { 
    itineraries, 
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    addExperienceToItinerary,
    removeExperienceFromItinerary
  } = useItineraries();

  const isInItinerary = (itineraryId: string) => {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    return itinerary?.experiences.some(e => e.id === experienceId) || false;
  };

  const [justAdded, setJustAdded] = useState<string | null>(null);
  const justAddedTimer = useRef<NodeJS.Timeout | null>(null);

  const handleToggleItinerary = (itinerary: Itinerary) => {
    const alreadyAdded = isInItinerary(itinerary.id);
    if ('vibrate' in navigator) navigator.vibrate(10);
    
    if (alreadyAdded) {
      removeExperienceFromItinerary(itinerary.id, experienceId);
      onRemove?.();
    } else {
      const result = addExperienceToItinerary(itinerary.id, experienceData);
      if (result.alreadyExists) {
        return;
      }
      setActiveItinerary(itinerary.id);
      setJustAdded(itinerary.id);
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
      justAddedTimer.current = setTimeout(() => setJustAdded(null), 1500);
      onAdd?.();
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    if ('vibrate' in navigator) navigator.vibrate(10);
    const newItinerary = await createItinerary(newName.trim());
    await addExperienceToItinerary(newItinerary.id, experienceData);
    onAdd?.();
    setNewName("");
    setShowNewInput(false);
    setOpen(false);
  };

  // Sort: selected itineraries first
  const sortedItineraries = [...itineraries].sort((a, b) => {
    const aIn = isInItinerary(a.id) ? 0 : 1;
    const bIn = isInItinerary(b.id) ? 0 : 1;
    return aIn - bIn;
  });

  const selectorContent = (
    <>
      <div className="px-4 pt-1 pb-3 border-b border-border">
        <h4 className="font-semibold text-base text-center">Add to itinerary</h4>
      </div>
      
      <div className="max-h-[50vh] overflow-y-auto">
        {sortedItineraries.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No itineraries yet</p>
          </div>
        )}
        {sortedItineraries.map((itinerary) => {
          const alreadyAdded = isInItinerary(itinerary.id);
          const wasJustAdded = justAdded === itinerary.id;
          return (
            <button
              key={itinerary.id}
              onClick={() => handleToggleItinerary(itinerary)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-muted/80",
                alreadyAdded && "bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0",
                  itinerary.id === activeItineraryId ? "bg-primary" : "bg-muted-foreground/30"
                )} />
                <span className="text-sm font-medium truncate">{itinerary.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({itinerary.experiences.length})
                </span>
              </div>
              {alreadyAdded ? (
                wasJustAdded ? (
                  <Check className="w-5 h-5 text-primary flex-shrink-0 animate-in zoom-in-50 duration-200" />
                ) : (
                  <Minus className="w-5 h-5 text-destructive flex-shrink-0" />
                )
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        {showNewInput ? (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Itinerary name"
              className="h-10 text-sm"
              style={{ fontSize: '16px' }}
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
              className="h-10 px-4"
              onClick={handleCreateAndAdd}
              disabled={!newName.trim()}
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewInput(true)}
            className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-primary active:bg-muted rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create new itinerary
          </button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children || (
            <Button 
              size="icon" 
              className="rounded-full shadow-lg"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="bg-card border-border" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 my-3" />
          {selectorContent}
          <div className="pb-[env(safe-area-inset-bottom,8px)]" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button 
            size="icon" 
            className="rounded-full shadow-lg"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 bg-card border-border shadow-xl z-50"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        {selectorContent}
      </PopoverContent>
    </Popover>
  );
};
