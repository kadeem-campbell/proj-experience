import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { BrowseDestination } from "@/hooks/useDestinations";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useIsMobile, useIsBelowDesktop } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
  showSidebar?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: BrowseDestination | null;
  onCitySelect?: (city: BrowseDestination | null) => void;
  onMobileSearchClick?: () => void;
}

// Sidebar toggle is now integrated inside the sidebar header itself.

export const MainLayout = ({ 
  children, 
  showItineraryPanel = false,
  showSidebar = true,
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  onMobileSearchClick,
}: MainLayoutProps) => {
  const belowDesktop = useIsBelowDesktop();

  // Hide the sidebar on tablet (and below): give the page the full width like mobile.
  if (!showSidebar || belowDesktop) {
    return (
      <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
        <main data-scroll-root="true" className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarToggleButton />
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <ItinerarySidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCity={selectedCity}
          onCitySelect={onCitySelect}
          onMobileSearchClick={onMobileSearchClick}
        />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-1 overflow-hidden">
            <main data-scroll-root="true" className="flex-1 overflow-auto min-w-0">
              {children}
            </main>
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
