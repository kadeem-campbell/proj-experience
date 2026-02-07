import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useItineraries } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";

interface SidebarItineraryCTAProps {
  collapsed?: boolean;
}

export const SidebarItineraryCTA = ({ collapsed = false }: SidebarItineraryCTAProps) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { itineraries, experienceCount } = useItineraries();

  // If user has 2+ itineraries, don't show this CTA
  if (itineraries.length >= 2) {
    return null;
  }

  const handleCreateItinerary = () => {
    setShowOnboarding(true);
  };

  const handleViewTrip = () => {
    if (itineraries.length === 1) {
      navigate(`/trip/${itineraries[0].id}`);
    } else {
      navigate('/itinerary');
    }
  };

  // 0 or 1 itineraries: show Create or View CTA
  const hasExperiences = experienceCount > 0;

  return (
    <>
      <div className={cn("px-2 mb-2", collapsed && "flex justify-center")}>
        {hasExperiences ? (
          <Button
            size="sm"
            className={cn(
              "gap-2 w-full justify-start",
              collapsed && "w-auto px-2"
            )}
            onClick={handleViewTrip}
          >
            <ArrowRight className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span>View Itinerary</span>
                <span className="ml-auto">({experienceCount})</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              "gap-2 w-full justify-start",
              collapsed && "w-auto px-2"
            )}
            onClick={handleCreateItinerary}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Create Itinerary</span>}
          </Button>
        )}
      </div>

      <OnboardingFlow open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
};
