import { } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItineraries } from "@/hooks/useItineraries";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface SidebarItineraryCTAProps {
  collapsed?: boolean;
}

export const SidebarItineraryCTA = ({ collapsed = false }: SidebarItineraryCTAProps) => {
  const navigate = useNavigate();
  const { itineraries, experienceCount, createItinerary } = useItineraries();
  const isMobile = useIsMobile();
  
  const isCollapsedView = collapsed || isMobile;

  // If user has 2+ itineraries, don't show this CTA
  if (itineraries.length >= 2) {
    return null;
  }

  const handleCreateItinerary = async () => {
    const newIt = await createItinerary("My Trip");
    navigate(`/trip/${newIt.id}`);
  };

  const handleViewTrip = () => {
    if (itineraries.length === 1) {
      navigate(`/trip/${itineraries[0].id}`);
    } else {
      navigate('/my-trips');
    }
  };

  // 0 or 1 itineraries: show Create or View CTA
  const hasExperiences = experienceCount > 0;

  return (
      <SidebarGroup className="py-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              {hasExperiences ? (
                <SidebarMenuButton
                  tooltip="View Itinerary"
                  onClick={handleViewTrip}
                  className={cn(isCollapsedView && "justify-center")}
                >
                  <ArrowRight className="w-4 h-4" />
                  {!isCollapsedView && (
                    <>
                      <span>View Itinerary</span>
                      <span className="ml-auto text-xs text-muted-foreground">({experienceCount})</span>
                    </>
                  )}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip="Create Itinerary"
                  onClick={handleCreateItinerary}
                  className={cn(isCollapsedView && "justify-center")}
                >
                  <Plus className="w-4 h-4" />
                  {!isCollapsedView && <span>Create Itinerary</span>}
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
  );
};
