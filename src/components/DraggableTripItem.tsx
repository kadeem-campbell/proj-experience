import { useState, useRef, useCallback } from "react";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import { GripVertical, Clock, MapPin, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DraggableTripItemProps {
  experience: LikedExperience;
  index: number;
  totalItems: number;
  isOwner: boolean;
  onTimeChange: (expId: string, newTime: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove?: (expId: string) => void;
  dayKey: string;
}

export const DraggableTripItem = ({
  experience,
  index,
  totalItems,
  isOwner,
  onTimeChange,
  onReorder,
  onRemove,
  dayKey,
}: DraggableTripItemProps) => {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const scheduledTime = experience.scheduledTime 
    ? format(parseISO(experience.scheduledTime), "HH:mm") 
    : "09:00";

  const handleTimeChange = (newTimeStr: string) => {
    if (!experience.scheduledTime) return;
    const [hours, mins] = newTimeStr.split(':').map(Number);
    const currentDate = parseISO(experience.scheduledTime);
    const newDate = setMinutes(setHours(currentDate, hours), mins);
    onTimeChange(experience.id, newDate.toISOString());
    setIsEditingTime(false);
  };

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!isOwner) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ index, dayKey }));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.dayKey === dayKey && data.index !== index) {
        onReorder(data.index, index);
      }
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  // Mobile touch handlers for drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isOwner) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, [isOwner]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isOwner) return;
    const diff = e.touches[0].clientY - touchStartY;
    setTranslateY(diff);
  }, [isDragging, isOwner, touchStartY]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    // Calculate if we should move up or down based on translate distance
    const itemHeight = itemRef.current?.offsetHeight || 80;
    const moveThreshold = itemHeight * 0.5;
    
    if (Math.abs(translateY) > moveThreshold) {
      const direction = translateY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(totalItems - 1, index + direction));
      if (newIndex !== index) {
        onReorder(index, newIndex);
      }
    }
    
    setTranslateY(0);
    setIsDragging(false);
  }, [isDragging, translateY, index, totalItems, onReorder]);

  // Move up/down buttons for mobile
  const handleMoveUp = () => {
    if (index > 0) onReorder(index, index - 1);
  };

  const handleMoveDown = () => {
    if (index < totalItems - 1) onReorder(index, index + 1);
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-card/60 border border-border/30 group transition-all duration-150",
        isDragging && "opacity-50 scale-[0.98] shadow-lg z-50",
        isOwner && "cursor-grab active:cursor-grabbing"
      )}
      style={{
        transform: isDragging ? `translateY(${translateY}px)` : undefined,
      }}
      draggable={isOwner && !isMobile}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Drag Handle */}
      {isOwner && (
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          {isMobile ? (
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMoveUp}
                disabled={index === 0}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMoveDown}
                disabled={index === totalItems - 1}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0">
        {experience.videoThumbnail ? (
          <img 
            src={experience.videoThumbnail} 
            alt={experience.title} 
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{experience.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
          {/* Editable Time */}
          {experience.scheduledTime && (
            isOwner ? (
              <Popover open={isEditingTime} onOpenChange={setIsEditingTime}>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors text-primary">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(experience.scheduledTime), "h:mm a")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Change time</p>
                    <Input
                      type="time"
                      defaultValue={scheduledTime}
                      onBlur={(e) => handleTimeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTimeChange((e.target as HTMLInputElement).value);
                        }
                      }}
                      className="w-32"
                      autoFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(parseISO(experience.scheduledTime), "h:mm a")}
              </span>
            )
          )}
          {experience.location && (
            <span className="text-muted-foreground truncate">{experience.location}</span>
          )}
        </div>
      </div>

      {/* Remove Button */}
      {isOwner && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 md:flex hidden shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(experience.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
