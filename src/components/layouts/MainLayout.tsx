import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
}

export const MainLayout = ({ children, showItineraryPanel = true }: MainLayoutProps) => {
  const { user, signOut, isAuthenticated, userProfile, isCreator } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <ItinerarySidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>

            {/* Right Side - Auth */}
            <div className="flex items-center gap-4">
              {/* WhatsApp Button */}
              <a 
                href="https://wa.me/447342750898?text=Hi%2C%20I%20need%20help%20with%20SWAM%20experiences"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:block"
              >
                <Button 
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-primary-foreground"
                >
                  WhatsApp
                </Button>
              </a>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {userProfile && (
                    <Badge variant={isCreator ? "default" : "secondary"} className="text-xs">
                      {userProfile.role || 'user'}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user?.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                </Link>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              {children}
            </main>

            {/* Right Itinerary Panel */}
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
