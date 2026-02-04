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

  // Initialize and oscillate "planning now" with natural daily fluctuation
  useEffect(() => {
    // Get hour of day for realistic fluctuation (more users during day)
    const getTimeBasedPlanning = () => {
      const hour = new Date().getHours();
      // Peak hours: 10am-2pm and 6pm-10pm, lower at night
      if (hour >= 10 && hour <= 14) return Math.floor(Math.random() * 80) + 180; // 180-260
      if (hour >= 18 && hour <= 22) return Math.floor(Math.random() * 100) + 200; // 200-300
      if (hour >= 6 && hour < 10) return Math.floor(Math.random() * 60) + 120; // 120-180
      if (hour > 14 && hour < 18) return Math.floor(Math.random() * 70) + 150; // 150-220
      return Math.floor(Math.random() * 50) + 60; // Night: 60-110
    };

    setPlanningNow(getTimeBasedPlanning());

    // Start trips at 1,231 base, grows slowly per day
    const daysSinceLaunch = Math.floor((Date.now() - new Date('2026-02-01').getTime()) / (1000 * 60 * 60 * 24));
    const baseTrips = 1231 + (daysSinceLaunch * 15);
    setItinerariesCreated(baseTrips + Math.floor(Math.random() * 10));

    const interval = setInterval(() => {
      setPlanningNow(prev => {
        // More natural fluctuation: -15 to +15, with time-based bias
        const hour = new Date().getHours();
        const bias = (hour >= 8 && hour <= 21) ? 2 : -2; // Trend up during day, down at night
        const delta = Math.floor(Math.random() * 31) - 15 + bias;
        const min = 50;
        const max = 350;
        return Math.max(min, Math.min(max, prev + delta));
      });

      // Trips always go up - add 1-3 every few seconds
      setItinerariesCreated(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);

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
      {/* Netflix-style Hero Tagline - more structured */}
      <div className="mb-5 md:mb-8 space-y-1">
        <h1 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-[1.15] tracking-tight">
          Visiting Zanzibar is one thing.
        </h1>
        <h1 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-primary leading-[1.15] tracking-tight">
          Experiencing it is another.
        </h1>
      </div>

      {/* Live Activity Bar */}
      <div className="bg-card border border-border/50 rounded-xl p-3 md:p-4 mb-6 md:mb-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-6">
          {/* Left: Live Stats */}
          <div className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span className="font-medium text-success tabular-nums">
                <span className="inline-block min-w-[2.5ch] text-right">{planningNow.toLocaleString()}</span> planning now
              </span>
            </div>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              5 destinations
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-activity" />
              <span className="tabular-nums">{itinerariesCreated.toLocaleString()}</span>+ trips created
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
            ) : (
              <Button size="sm" onClick={handlePlanTripClick} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Plan your trip
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between">
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
          ) : (
            <Button size="sm" onClick={handlePlanTripClick} className="gap-1.5 h-8 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Plan trip
            </Button>
          )}
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
