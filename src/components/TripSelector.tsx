import { useState } from "react";
import { format, parseISO } from "date-fns";
import { 
  Calendar, ChevronDown, ChevronRight, Trash2, Edit2, Check, X, Rocket 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Trip } from "@/hooks/useItineraries";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TripSelectorProps {
  trips: Trip[];
  activeTripId?: string;
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onRenameTrip: (tripId: string, newName: string) => void;
  onDateRangeSelected: (startDate: Date, endDate?: Date) => void;
  className?: string;
}

export function TripSelector({
  trips,
  activeTripId,
  onSelectTrip,
  onDeleteTrip,
  onRenameTrip,
  onDateRangeSelected,
  className
}: TripSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>();
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>();

  const handleStartEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setEditName(trip.name);
  };

  const handleSaveEdit = (tripId: string) => {
    if (editName.trim()) {
      onRenameTrip(tripId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setTempStartDate(range?.from);
    setTempEndDate(range?.to);
    
    // Auto-generate when both dates are selected
    if (range?.from && range?.to) {
      setDatePickerOpen(false);
      onDateRangeSelected(range.from, range.to);
      setTempStartDate(undefined);
      setTempEndDate(undefined);
    }
  };

  const hasTrips = trips.length > 0;
  const buttonLabel = hasTrips ? "Add another trip" : "Make a Trip";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Make a Trip / Add another trip button with date picker */}
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Rocket className="w-4 h-4" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="range"
            selected={{ from: tempStartDate, to: tempEndDate }}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* My Trips section - only show if there are trips */}
      {hasTrips && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between px-3 py-2 bg-card/50 border border-border rounded-t-lg">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">My Trips ({trips.length})</span>
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="border border-t-0 border-border rounded-b-lg overflow-hidden">
            <div className="divide-y divide-border">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={cn(
                    "group px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors",
                    activeTripId === trip.id && "bg-accent/30"
                  )}
                  onClick={() => {
                    if (editingId !== trip.id) {
                      onSelectTrip(trip.id);
                    }
                  }}
                >
                  {editingId === trip.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(trip.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(trip.id); }}
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{trip.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(trip.startDate), "MMM d")}
                          {trip.endDate && ` - ${format(parseISO(trip.endDate), "MMM d")}`}
                          {" · "}
                          {trip.experiences.length} activities
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(trip); }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        {trips.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
