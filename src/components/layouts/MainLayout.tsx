import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { LogOut, User, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useItineraries } from "@/hooks/useItineraries";

interface MainLayoutProps {
  children: ReactNode;
  showItineraryPanel?: boolean;
}

export const MainLayout = ({ children, showItineraryPanel = false }: MainLayoutProps) => {
  const { user, signOut, isAuthenticated, userProfile, isCreator } = useAuth();
  const { experienceCount } = useItineraries();
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <ItinerarySidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-12 md:h-14 items-center justify-between gap-2 md:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger />
            </div>

            {/* Right Side - Auth & Mobile Itinerary */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Itinerary Button */}
              {showItineraryPanel && (
                <Sheet open={mobileItineraryOpen} onOpenChange={setMobileItineraryOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="lg:hidden relative"
                    >
                      <MapPin className="w-4 h-4" />
                      {experienceCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                          {experienceCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-96 p-0">
                    <ItineraryPanel isMobile />
                  </SheetContent>
                </Sheet>
              )}

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
                    <Badge variant={isCreator ? "default" : "secondary"} className="text-xs hidden sm:inline-flex">
                      {userProfile.role || 'user'}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground hidden md:inline">
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
                    <User className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Log In</span>
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

            {/* Right Itinerary Panel - Desktop Only */}
            {showItineraryPanel && <ItineraryPanel />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
