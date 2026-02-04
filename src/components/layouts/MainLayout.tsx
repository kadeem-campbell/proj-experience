import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
}

export const MainLayout = ({ children, showItineraryPanel = false }: MainLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      {/*
        IMPORTANT: use a fixed viewport height so the scroll happens inside our <main>
        (overflow-auto). If the browser window scrolls instead, `position: sticky` inside
        overflow-hidden ancestors won't work reliably.
      */}
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <ItinerarySidebar />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
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
