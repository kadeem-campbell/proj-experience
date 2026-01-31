import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveActivityBannerProps {
  experienceCount: number;
}

export const LiveActivityBanner = ({ experienceCount }: LiveActivityBannerProps) => {
  const [planningNow, setPlanningNow] = useState(0);
  const [itinerariesCreated, setItinerariesCreated] = useState(0);

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

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 md:mb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-sm font-medium text-success">{planningNow.toLocaleString()} planning now</span>
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
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Click + to start planning</span>
              <span className="sm:hidden">Tap + to add</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};