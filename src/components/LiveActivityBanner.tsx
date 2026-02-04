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
      <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
              <span className="text-sm font-medium text-success tabular-nums"><span className="inline-block min-w-[2.5ch] text-right">{planningNow.toLocaleString()}</span> planning now</span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                20 destinations
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-activity" />
                {itinerariesCreated.toLocaleString()}+ itineraries created
              </span>
            </div>
          </div>
          
          {/* Hero tagline - one line, separate from stats */}
          <div className="mb-2 md:mb-0">
            <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">
              Visiting Zanzibar is one thing. Experiencing it is another.
            </h2>
          </div>
          
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            
            <div className="flex items-center gap-3">
              {experienceCount > 0 ? (
                <Link to="/itinerary">
                  <Button size="sm" className="gap-2 md:hidden">
                    My Trip ({experienceCount})
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button size="default" className="gap-2 hidden md:flex">
                    View My Itinerary ({experienceCount})
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : hasSeenEducation ? (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Click + to start planning</span>
                  <span className="sm:hidden">Tap + to add</span>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handlePlanTripClick}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Plan your trip
                </Button>
              )}
            </div>
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
