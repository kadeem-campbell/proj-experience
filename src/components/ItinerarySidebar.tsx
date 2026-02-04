import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Globe, 
  Lock,
  Users,
  ChevronDown,
  ChevronRight,
  Compass,
  Search,
  UserCircle,
  Sparkles,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Auto-dismiss hint component
const AutoDismissHint = ({ onDismiss }: { onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="mx-2 mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20 relative animate-in fade-in duration-300">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Your Trip Planner</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save experiences here to build your perfect Zanzibar itinerary
          </p>
        </div>
      </div>
    </div>
  );
};

export const ItinerarySidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();
  
  const {
    itineraries,
    activeItinerary,
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    deleteItinerary,
    renameItinerary,
    togglePublic
  } = useItineraries();

  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [itinerariesOpen, setItinerariesOpen] = useState(true);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);

  useEffect(() => {
    const hasSeenSidebarGuide = localStorage.getItem('hasSeenSidebarGuide');
    if (!hasSeenSidebarGuide) {
      setShowOnboardingHint(true);
    }
  }, []);

  const dismissOnboardingHint = () => {
    localStorage.setItem('hasSeenSidebarGuide', 'true');
    setShowOnboardingHint(false);
  };

  const handleCreate = () => {
    if (newItineraryName.trim()) {
      createItinerary(newItineraryName.trim());
      setNewItineraryName("");
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameItinerary(id, editName.trim());
      setEditingId(null);
    }
  };

  const navItems = [
    { path: "/", label: "Discover", icon: Compass },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              SWAM
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground uppercase text-xs tracking-wider">
              {!collapsed && "Browse"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      tooltip={item.label}
                    >
                      <Link to={item.path} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Itineraries */}
          <SidebarGroup>
            {/* Onboarding hint for first-time users - auto dismisses */}
            {showOnboardingHint && !collapsed && (
              <AutoDismissHint onDismiss={dismissOnboardingHint} />
            )}

            <Collapsible open={itinerariesOpen} onOpenChange={setItinerariesOpen}>
              <div className="flex items-center justify-between pr-2">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-muted-foreground uppercase text-xs tracking-wider hover:text-foreground transition-colors p-2">
                    {itinerariesOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {!collapsed && "My Itineraries"}
                  </button>
                </CollapsibleTrigger>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <CollapsibleContent>
                <SidebarGroupContent>
                  {/* New Itinerary Input */}
                  {isCreating && !collapsed && (
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newItineraryName}
                          onChange={(e) => setNewItineraryName(e.target.value)}
                          placeholder="Trip name..."
                          className="h-10 text-base"
                          style={{ fontSize: '16px' }} // Prevent iOS zoom
                          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                          autoFocus
                        />
                        <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleCreate}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 shrink-0"
                          onClick={() => setIsCreating(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <SidebarMenu>
                    {itineraries.map((itinerary) => (
                      <SidebarMenuItem key={itinerary.id}>
                        {editingId === itinerary.id && !collapsed ? (
                          <div className="flex items-center gap-2 px-2 py-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-10 text-base"
                              style={{ fontSize: '16px' }} // Prevent iOS zoom
                              onKeyDown={(e) => e.key === "Enter" && handleRename(itinerary.id)}
                              autoFocus
                            />
                            <Button 
                              size="icon" 
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleRename(itinerary.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 shrink-0"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <SidebarMenuButton
                            isActive={activeItineraryId === itinerary.id}
                            onClick={() => {
                              setActiveItinerary(itinerary.id);
                              navigate(`/trip/${itinerary.id}`);
                            }}
                            className="group/item"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {itinerary.isPublic ? (
                                <Globe className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                              )}
                              {!collapsed && (
                                <>
                                  <span className="truncate">{itinerary.name}</span>
                                  <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                                    {itinerary.experiences.length}
                                  </Badge>
                                </>
                              )}
                            </div>
                            
                            {!collapsed && (
                              <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 ml-2">
                                <span
                                  role="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePublic(itinerary.id);
                                  }}
                                >
                                  {itinerary.isPublic ? (
                                    <Lock className="w-3 h-3" />
                                  ) : (
                                    <Globe className="w-3 h-3" />
                                  )}
                                </span>
                                <span
                                  role="button"
                                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(itinerary.id);
                                    setEditName(itinerary.name);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </span>
                                {itineraries.length > 1 && (
                                  <span
                                    role="button"
                                    className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-destructive hover:text-destructive cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItinerary(itinerary.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            )}
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {/* Mobile: Show Sign Up / User info */}
          {isMobile && (
            <SidebarMenuItem>
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium truncate">
                      {userProfile?.username || userProfile?.full_name || user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </div>
                  </div>
                  <SidebarMenuButton onClick={signOut} className="text-destructive">
                    <LogOut className="w-4 h-4" />
                    {!collapsed && <span>Sign out</span>}
                  </SidebarMenuButton>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              )}
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="About">
              <Link to="/about" className="flex items-center gap-3">
                <Compass className="w-4 h-4" />
                {!collapsed && <span>About</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Auth Modal for mobile sign up */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
};
