import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, X, MapPin, Clock, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Itinerary, Trip } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";

interface PresentationModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: Itinerary;
  selectedTrip?: Trip | null;
}

export function PresentationMode({ open, onOpenChange, itinerary, selectedTrip }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build slides from experiences
  const slides = [
    // Title slide
    { type: 'title' as const, itinerary },
    // Experience slides
    ...itinerary.experiences.map(exp => ({ type: 'experience' as const, experience: exp })),
    // End slide
    { type: 'end' as const, itinerary }
  ];

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slides.length]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onOpenChange]);

  // Reset on close
  useEffect(() => {
    if (!open) setCurrentSlide(0);
  }, [open]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-background border-0 rounded-none">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-background/50 backdrop-blur-sm">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="bg-background/50 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Slide Content */}
        <div className="w-full h-full flex items-center justify-center p-8 md:p-16">
          {currentSlideData.type === 'title' && (
            <div className="text-center max-w-4xl">
              <div className="w-32 h-32 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
                {itinerary.coverImage ? (
                  <img src={itinerary.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                    <span className="text-5xl">🗺️</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                {itinerary.name}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                {itinerary.experiences.length} experiences to explore
              </p>
              {selectedTrip && (
                <p className="text-lg text-primary mt-4">
                  {format(parseISO(selectedTrip.startDate), "MMMM d")}
                  {selectedTrip.endDate && ` - ${format(parseISO(selectedTrip.endDate), "MMMM d, yyyy")}`}
                </p>
              )}
            </div>
          )}

          {currentSlideData.type === 'experience' && currentSlideData.experience && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 max-w-6xl w-full">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                {currentSlideData.experience.videoThumbnail ? (
                  <img 
                    src={currentSlideData.experience.videoThumbnail} 
                    alt={currentSlideData.experience.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-primary/50" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                  {currentSlideData.experience.category}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  {currentSlideData.experience.title}
                </h2>
                <div className="space-y-3 text-lg text-muted-foreground">
                  {currentSlideData.experience.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {currentSlideData.experience.location}
                    </p>
                  )}
                  {currentSlideData.experience.scheduledTime && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {format(new Date(currentSlideData.experience.scheduledTime), "EEEE, h:mm a")}
                    </p>
                  )}
                  {currentSlideData.experience.price && (
                    <p className="text-2xl font-semibold text-primary mt-4">
                      {currentSlideData.experience.price}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentSlideData.type === 'end' && (
            <div className="text-center max-w-4xl">
              <span className="text-6xl mb-8 block">🎉</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready for Adventure!</h2>
              <p className="text-xl text-muted-foreground mb-8">
                {itinerary.experiences.length} experiences await you
              </p>
              <Button size="lg" onClick={() => onOpenChange(false)} className="text-lg px-8">
                Exit Presentation
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentSlide + 1} / {slides.length}
          </span>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="rounded-full w-12 h-12"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
