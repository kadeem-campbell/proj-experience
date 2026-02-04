import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Globe, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useItineraries } from "@/hooks/useItineraries";

interface LiveActivityBannerProps {
  experienceCount: number;
}

export const LiveActivityBanner = ({ experienceCount }: LiveActivityBannerProps) => {
  const [planningNow, setPlanningNow] = useState(0);
  const [itinerariesCreated, setItinerariesCreated] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { itineraries } = useItineraries();
  
  // Get sidebar context - may not exist if not wrapped in provider
  let sidebarContext: ReturnType<typeof useSidebar> | null = null;
  try {
    sidebarContext = useSidebar();
  } catch {
    // Component is outside SidebarProvider
  }

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

  const handleCreateItinerary = () => {
    setShowOnboarding(true);
  };

  const handleViewTrip = () => {
    // Dispatch event to tell sidebar to expand itineraries and highlight
    window.dispatchEvent(new CustomEvent('openItinerariesSidebar'));
    
    // Open sidebar on mobile, expand on desktop
    if (sidebarContext) {
      if (isMobile) {
        sidebarContext.setOpenMobile(true);
      } else {
        sidebarContext.setOpen(true);
      }
    }
    
    // Only navigate to itinerary if there's exactly one itinerary
    // Otherwise, let user choose from sidebar
    if (itineraries.length === 1) {
      navigate('/itinerary');
    }
  };

  return (
    <>
      {/* CTA Bar - Clean, minimal */}
      <div className="bg-card border border-border/50 rounded-xl p-3 md:p-4 mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          {/* Left: Trips created stat */}
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-activity" />
              <span className="tabular-nums font-medium">{itinerariesCreated.toLocaleString()}</span>
              <span className="hidden sm:inline">+ trips created</span>
              <span className="sm:hidden">trips</span>
            </span>
          </div>
          
          {/* Right: CTA */}
          <div className="shrink-0">
            {experienceCount > 0 ? (
              <Button size="sm" className="gap-2" onClick={handleViewTrip}>
                <span className="hidden sm:inline">View My Itinerary</span>
                <span className="sm:hidden">View Trip</span>
                <span>({experienceCount})</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreateItinerary} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Itinerary</span>
                <span className="sm:hidden">Create</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Flow */}
      <OnboardingFlow open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
};
