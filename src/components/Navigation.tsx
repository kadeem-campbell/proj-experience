import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, LogOut } from "lucide-react";
import { ExportDropdown } from "@/components/ExportDropdown";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Hidden navigation items - set to false to show
const HIDDEN_NAV_ITEMS = {
  map: true,
  socialFinder: true,
  travellers: true,
  creators: true,
};

export const Navigation = () => {
  const { count } = useLikedExperiences();
  const { user, signOut, isAuthenticated, userProfile, isCreator, refreshProfile } = useAuth();
  const { toast } = useToast();

  const handleRoleSwitch = async () => {
    if (!user || !userProfile) return;
    
    const newRole = userProfile.role === 'creator' ? 'traveler' : 'creator';
    
    try {
      // Use edge function for role changes (server-side validation)
      const { data, error } = await supabase.functions.invoke('change-role', {
        body: { role: newRole }
      });

      if (error) throw error;
      
      // Refresh the profile to update the UI
      refreshProfile?.();
      
      toast({
        title: "Role Updated",
        description: `You are now a ${newRole}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              SWAM
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                Experiences
              </Link>
              {!HIDDEN_NAV_ITEMS.map && (
                <Link to="/map" className="text-muted-foreground hover:text-foreground transition-colors">
                  Map
                </Link>
              )}
              {!HIDDEN_NAV_ITEMS.travellers && (
                <Link to="/travellers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Travellers
                </Link>
              )}
              {!HIDDEN_NAV_ITEMS.creators && (
                <Link to="/creators" className="text-muted-foreground hover:text-foreground transition-colors">
                  Creators
                </Link>
              )}
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              {userProfile?.role === 'admin' && (
                <Link to="/management" className="text-muted-foreground hover:text-foreground transition-colors">
                  Management
                </Link>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Itinerary with Export Options */}
            <div className="relative">
              <ExportDropdown />
            </div>

            {/* WhatsApp Button */}
            <a 
              href="https://wa.me/447342750898?text=Hi%2C%20I%20need%20help%20with%20SWAM%20experiences"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                className="hidden sm:flex bg-green-500 hover:bg-green-600 text-white"
              >
                WhatsApp
              </Button>
            </a>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {userProfile && (
                  <div className="flex items-center gap-2">
                    <Badge variant={isCreator ? "default" : "secondary"} className="text-xs">
                      {userProfile.role || 'user'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRoleSwitch}
                      className="text-xs"
                    >
                      Switch to {isCreator ? 'Traveler' : 'Creator'}
                    </Button>
                  </div>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="text-foreground hover:text-primary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};