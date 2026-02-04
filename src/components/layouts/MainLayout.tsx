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
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { cn } from "@/lib/utils";
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
  showSmartHeader?: boolean;
}

export const MainLayout = ({ children, showItineraryPanel = false, showSmartHeader = true }: MainLayoutProps) => {
  const { user, signOut, isAuthenticated, userProfile } = useAuth();
  const { experienceCount } = useItineraries();
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const showHeader = useScrollHeader(100);

  const displayName = userProfile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <ItinerarySidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Smart Appearing Header - only shows when scrolling up */}
          {showSmartHeader && (
            <header 
              className={cn(
                "fixed top-0 left-0 right-0 z-[60] flex h-12 items-center justify-between gap-2 md:gap-4 border-b border-border bg-background/95 backdrop-blur-lg px-3 md:px-4 transition-transform duration-300 ease-out",
                showHeader ? "translate-y-0" : "-translate-y-full"
              )}
            >
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  SWAM
                </span>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="hidden md:inline text-sm font-medium">{displayName}</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setAuthModalOpen(true)}
                    className="font-medium"
                  >
                    Sign up
                  </Button>
                )}
              </div>
            </header>
          )}

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
