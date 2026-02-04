import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, MapPin, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useItineraries } from "@/hooks/useItineraries";
import { AuthModal } from "@/components/AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
}

export const MainLayout = ({ children, showItineraryPanel = false }: MainLayoutProps) => {
  const { user, signOut, isAuthenticated, userProfile } = useAuth();
  const { experienceCount } = useItineraries();
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const displayName = userProfile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <ItinerarySidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              {children}
            </main>

            {/* Right Itinerary Panel - Desktop Only */}
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </SidebarProvider>
  );
};
