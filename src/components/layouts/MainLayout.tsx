import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { City } from "@/data/browseData";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
  onMobileSearchClick?: () => void;
}

export const MainLayout = ({ 
  children, 
  showItineraryPanel = false,
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  onMobileSearchClick,
}: MainLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      {/*
        IMPORTANT: use a fixed viewport height so the scroll happens inside our <main>
        (overflow-auto). If the browser window scrolls instead, `position: sticky` inside
        overflow-hidden ancestors won't work reliably.
      */}
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <ItinerarySidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCity={selectedCity}
          onCitySelect={onCitySelect}
          onMobileSearchClick={onMobileSearchClick}
        />
        
        {/* Add left margin on mobile to account for fixed icon sidebar */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 ml-[3rem] md:ml-0">
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto min-w-0">
              {children}
            </main>

            {/* Right Itinerary Panel - Desktop Only */}
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
