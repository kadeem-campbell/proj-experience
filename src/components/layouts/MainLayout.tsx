import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { BrowseDestination } from "@/hooks/useDestinations";
import { useIsBelowDesktop } from "@/hooks/use-mobile";

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
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <ItinerarySidebar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCity={selectedCity}
          onCitySelect={onCitySelect}
          onMobileSearchClick={onMobileSearchClick}
        />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-1 overflow-hidden relative">
            <CollapsedSidebarRail />
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

const CollapsedSidebarRail = () => {
  const { state, toggleSidebar } = useSidebar();
  if (state !== "collapsed") return null;
  return (
    <div className="absolute top-3 left-2 z-30 flex items-center gap-1">
      <button
        onClick={toggleSidebar}
        title="Expand sidebar"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <PanelLeft className="w-4 h-4" />
      </button>
      <Link
        to="/"
        className="flex items-center px-2 h-9 rounded-lg hover:bg-muted transition-colors text-[20px] tracking-[-0.03em] text-foreground"
        style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", fontWeight: 800, letterSpacing: '-0.5px' }}
      >
        swam<span className="text-primary font-extrabold">.app</span>
      </Link>
    </div>
  );
};
