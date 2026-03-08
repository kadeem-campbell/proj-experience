import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { City } from "@/data/browseData";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
  onMobileSearchClick?: () => void;
}

const SidebarToggleButton = () => {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="fixed top-3 left-3 z-50 h-8 w-8 shrink-0"
    >
      {collapsed ? (
        <PanelLeft className="w-4 h-4" />
      ) : (
        <PanelLeftClose className="w-4 h-4" />
      )}
    </Button>
  );
};

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
      <SidebarToggleButton />
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <ItinerarySidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCity={selectedCity}
          onCitySelect={onCitySelect}
          onMobileSearchClick={onMobileSearchClick}
        />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0 ml-[3rem] md:ml-0">
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto min-w-0">
              {children}
            </main>
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
