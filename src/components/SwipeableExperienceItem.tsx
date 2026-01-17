import { useState, useRef, useCallback } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableExperienceItemProps {
  children: React.ReactNode;
  onSwipeRemove: () => void;
  className?: string;
}

export const SwipeableExperienceItem = ({
  children,
  onSwipeRemove,
  className = "",
}: SwipeableExperienceItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80;
  const DELETE_REVEAL_WIDTH = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    
    // Only allow left swipe (positive diff means swiping left)
    if (diff > 0) {
      // Limit the swipe distance with some resistance
      const resistance = diff > DELETE_REVEAL_WIDTH ? 0.3 : 1;
      const newTranslate = Math.min(diff * resistance, DELETE_REVEAL_WIDTH + 30);
      setTranslateX(-newTranslate);
    } else {
      // Spring back when swiping right
      setTranslateX(Math.max(diff * 0.5, 0));
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const diff = startX.current - currentX.current;
    
    if (diff > SWIPE_THRESHOLD) {
      // Show delete button
      setTranslateX(-DELETE_REVEAL_WIDTH);
    } else {
      // Spring back
      setTranslateX(0);
    }
  }, []);

  const handleDeleteClick = useCallback(() => {
    // Animate out then delete
    setTranslateX(-300);
    setTimeout(() => {
      onSwipeRemove();
    }, 200);
  }, [onSwipeRemove]);

  const handleReset = useCallback(() => {
    setTranslateX(0);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={translateX < 0 ? handleReset : undefined}
    >
      {/* Delete background revealed on swipe */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive"
        style={{ width: DELETE_REVEAL_WIDTH }}
      >
        <button
          onClick={handleDeleteClick}
          className="flex items-center justify-center w-full h-full text-destructive-foreground"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      {/* Main content */}
      <div
        className="relative bg-background"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
