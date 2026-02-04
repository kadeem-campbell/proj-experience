import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Globe, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LiveActivityBannerProps {
  experienceCount: number;
}

export const LiveActivityBanner = ({ experienceCount }: LiveActivityBannerProps) => {
  const [planningNow, setPlanningNow] = useState(0);
  const [itinerariesCreated, setItinerariesCreated] = useState(0);
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Check if user has seen the education modal before
  const hasSeenEducation = localStorage.getItem('hasSeenTripEducation') === 'true';

  // Initialize and oscillate "planning now" naturally (max 300)
  useEffect(() => {
    // Start with a random value between 150-280
    const initialPlanning = Math.floor(Math.random() * 130) + 150;
    setPlanningNow(initialPlanning);

    // Start with a random value between 1000-1500
    const initialItineraries = Math.floor(Math.random() * 500) + 1000;
    setItinerariesCreated(initialItineraries);

    const interval = setInterval(() => {
      setPlanningNow(prev => {
        // Random walk: -5 to +5, clamped between 80 and 300
        const delta = Math.floor(Math.random() * 11) - 5;
        return Math.max(80, Math.min(300, prev + delta));
      });

      // Occasionally bump itineraries created (only goes up, slowly)
      if (Math.random() > 0.7) {
        setItinerariesCreated(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handlePlanTripClick = () => {
    if (!hasSeenEducation) {
      setShowEducationModal(true);
    }
  };

  const handleContinueToTrip = () => {
    localStorage.setItem('hasSeenTripEducation', 'true');
    setShowEducationModal(false);
  };

  return (
    <>
      <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5 mb-6 md:mb-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-6">
          {/* Left: Tagline */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              Visiting Zanzibar is one thing. <span className="text-primary">Experiencing it is another.</span>
            </h2>
          </div>
          
          {/* Center: Live Stats */}
          <div className="flex items-center gap-5 text-sm shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span className="font-medium text-success tabular-nums">
                <span className="inline-block min-w-[2.5ch] text-right">{planningNow.toLocaleString()}</span> planning
              </span>
            </div>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              20 destinations
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-activity" />
              <span className="tabular-nums">{itinerariesCreated.toLocaleString()}</span>+ trips
            </span>
          </div>
          
          {/* Right: CTA */}
          <div className="shrink-0">
            {experienceCount > 0 ? (
              <Link to="/itinerary">
                <Button size="sm" className="gap-2">
                  View My Itinerary ({experienceCount})
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : hasSeenEducation ? (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg text-sm">
                <Plus className="w-4 h-4" />
                Click + to start planning
              </div>
            ) : (
              <Button size="sm" onClick={handlePlanTripClick} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Plan your trip
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Top row: Live indicator + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span className="text-sm font-medium text-success tabular-nums">
                <span className="inline-block min-w-[2.5ch] text-right">{planningNow.toLocaleString()}</span> planning now
              </span>
            </div>
            
            {experienceCount > 0 ? (
              <Link to="/itinerary">
                <Button size="sm" className="gap-1.5 h-8 text-xs">
                  My Trip ({experienceCount})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : hasSeenEducation ? (
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg text-xs">
                <Plus className="w-3.5 h-3.5" />
                Tap + to add
              </div>
            ) : (
              <Button size="sm" onClick={handlePlanTripClick} className="gap-1.5 h-8 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Plan trip
              </Button>
            )}
          </div>
          
          {/* Bottom: Tagline */}
          <div className="pt-1 border-t border-border/30">
            <p className="text-base font-semibold text-foreground leading-snug">
              Visiting Zanzibar is one thing.{" "}
              <span className="text-primary">Experiencing it is another.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Education Modal */}
      <Dialog open={showEducationModal} onOpenChange={setShowEducationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Welcome to Zanzibar
            </DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-4">
              <p className="text-lg italic text-foreground">
                "Visiting Zanzibar is one thing, Experiencing it is another."
              </p>
              <p className="text-muted-foreground">
                Browse unique experiences curated by locals and travelers. Tap the <Plus className="w-4 h-4 inline-block mx-1" /> button on any experience to add it to your personal trip itinerary.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleContinueToTrip} className="gap-2">
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
