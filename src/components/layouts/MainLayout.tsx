import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ItinerarySidebar } from "@/components/ItinerarySidebar";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { NotificationBell } from "@/components/NotificationBell";
import { AuthModal } from "@/components/AuthModal";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
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

const TopRightProfile = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center overflow-hidden transition-colors ring-1 ring-border"
            aria-label="Account"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isAuthenticated ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">
                  {userProfile?.full_name || userProfile?.username || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setAuthOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Sign in
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

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
            <TopRightProfile />
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
