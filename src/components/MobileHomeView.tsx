import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Plus, Layers, MapPin, User, Home, Search, ListMusic, PlusCircle, Settings, HelpCircle, Map, X, ChevronRight } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";

type TabType = "itineraries" | "experiences";

// Horizontal scroll row component with left padding, overflow right
const HorizontalScrollRow = ({ 
  title, 
  onTitleClick,
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-8">
      {/* Title - full clickable, no chevron */}
      <button 
        onClick={onTitleClick}
        className="mb-4 px-4 block"
      >
        <h2 className="text-lg font-bold text-foreground text-left truncate">{title}</h2>
      </button>
      
      {/* Horizontal scroll container - left padded, overflows right */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pl-4 pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Itinerary card for horizontal scroll - 3:2 aspect ratio
const MobileItineraryCard = ({ itinerary }: { itinerary: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', {
        id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage,
        creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3)
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[55vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/public-itinerary/${itinerary.id}`)}
    >
      <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked && "bg-destructive/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xl shadow-sm flex items-center gap-1">
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {experienceCount} {experienceCount === 1 ? 'activity' : 'activities'}
        </p>
      </div>
    </div>
  );
};

// Experience card for horizontal scroll - 4:3 aspect ratio
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { addExperienceToItinerary, activeItinerary, isInItinerary, removeExperienceFromItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;
  const inItinerary = isInItinerary(experience.id);

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id, title: experience.title,
        videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  const handleAddClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (activeItinerary) {
      if (inItinerary) {
        removeExperienceFromItinerary(activeItinerary.id, experience.id);
      } else {
        addExperienceToItinerary(activeItinerary.id, experience);
      }
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[55vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/experience/${experience.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked && "bg-destructive/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <button onClick={handleAddClick} className={cn(
          "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
          inItinerary ? "bg-primary text-primary-foreground" : "bg-background/70 backdrop-blur-xl shadow-sm"
        )}>
          <Plus className={cn("w-4 h-4", inItinerary ? "rotate-45" : "text-foreground")} />
        </button>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
        {experience.price && (
          <p className="text-xs text-muted-foreground">~{experience.price}</p>
        )}
      </div>
    </div>
  );
};

// Spotify-style left slide-out profile menu
const ProfileSlideMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "Guest";

  const menuItems = [
    { icon: User, label: "View Profile", action: () => navigate("/profile") },
    { icon: Settings, label: "Settings", action: () => navigate("/profile") },
    { icon: HelpCircle, label: "Contact Support", action: () => navigate("/about") },
    { icon: Map, label: "Build Itineraries", action: () => navigate("/itineraries") },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* Slide panel */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-[61] w-[75vw] max-w-[300px] bg-card border-r border-border transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-5 pt-[calc(env(safe-area-inset-top,12px)+12px)] border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
          {user?.email && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
          )}
        </div>

        {/* Menu items */}
        <div className="flex-1 py-3">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={() => { action(); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[15px] font-medium text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Fixed bottom navigation bar with gradient
const MobileBottomNav = ({ onSearchClick }: { onSearchClick: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const handleHomeClick = useCallback(() => {
    if (location.pathname === "/") {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Also try scrolling the main content container
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  const navItems = [
    { icon: Home, label: "Home", action: handleHomeClick, isActive: location.pathname === "/" },
    { icon: Search, label: "Search", action: onSearchClick, isActive: false },
    { icon: ListMusic, label: "Your Itinerary", action: () => navigate("/itineraries"), isActive: location.pathname === "/itineraries" },
    { icon: PlusCircle, label: "Create", action: () => navigate("/itineraries?create=true"), isActive: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient overlay - dark at bottom, transparent at top */}
      <div className="absolute inset-0 -top-12 pointer-events-none bg-gradient-to-t from-[hsl(0,0%,7.1%)] via-[hsl(0,0%,7.1%,0.8)] to-transparent" />
      
      {/* Nav bar */}
      <div className="relative flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {navItems.map(({ icon: Icon, label, action, isActive }) => (
          <button
            key={label}
            onClick={action}
            className="flex flex-col items-center gap-1 min-w-[60px] py-1"
          >
            <Icon className={cn("w-6 h-6", isActive ? "text-foreground" : "text-muted-foreground")} />
            <span className={cn("text-[10px]", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const MobileHomeView = () => {
  const [activeTab, setActiveTab] = useState<TabType>("itineraries");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const itineraries = getPopularItineraries();
  const experiences = allExperiences;

  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);
  const wildlifeExperiences = experiences.filter(e => e.category === "Wildlife").slice(0, 10);
  const partyExperiences = experiences.filter(e => e.category === "Party").slice(0, 10);

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "you";

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7.1%)]">
      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(q) => { setSearchQuery(q); setMobileSearchOpen(false); }}
      />

      {/* Profile Slide Menu */}
      <ProfileSlideMenu isOpen={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} />

      {/* Fixed Header - Spotify style */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[hsl(0,0%,7.1%)] safe-area-inset-top">
        {/* Top row: User avatar + Tab pills */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          {/* Profile avatar - opens slide menu */}
          <button 
            onClick={() => setProfileMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          {/* Tab pills - Spotify style */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("itineraries")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                activeTab === "itineraries" 
                  ? "bg-foreground text-background" 
                  : "bg-muted text-foreground"
              )}
            >
              Itineraries
            </button>
            <button
              onClick={() => setActiveTab("experiences")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                activeTab === "experiences" 
                  ? "bg-foreground text-background" 
                  : "bg-muted text-foreground"
              )}
            >
              Experiences
            </button>
          </div>
        </div>
      </div>

      {/* Content - with space for fixed header + bottom nav */}
      <div className="pt-16 pb-24">
        {/* Greeting - Spotify "Made for X" style */}
        <div className="px-4 mb-6 pt-2">
          <h1 className="text-2xl font-bold text-foreground">
            Made for {displayName}
          </h1>
        </div>

        {activeTab === "itineraries" ? (
          <>
            <HorizontalScrollRow 
              title="Attractions you can't miss"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(0, 6).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>

            <HorizontalScrollRow 
              title="Available in Dar Es Salaam next weekend"
              onTitleClick={() => navigate("/experiences?location=dar")}
            >
              {experiences.slice(0, 8).map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>

            <HorizontalScrollRow 
              title="Curated by locals"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(3, 9).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>

            {adventureExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Adventure awaits"
                onTitleClick={() => navigate("/experiences?category=adventure")}
              >
                {adventureExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {foodExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Taste the local flavors"
                onTitleClick={() => navigate("/experiences?category=food")}
              >
                {foodExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}
          </>
        ) : (
          <>
            <HorizontalScrollRow 
              title="Available in Dar Es Salaam next weekend"
              onTitleClick={() => navigate("/experiences?location=dar")}
            >
              {experiences.slice(0, 8).map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>

            {adventureExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Adventure awaits"
                onTitleClick={() => navigate("/experiences?category=adventure")}
              >
                {adventureExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {beachExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Beach vibes"
                onTitleClick={() => navigate("/experiences?category=beach")}
              >
                {beachExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {foodExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Taste the local flavors"
                onTitleClick={() => navigate("/experiences?category=food")}
              >
                {foodExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {wildlifeExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Wildlife encounters"
                onTitleClick={() => navigate("/experiences?category=wildlife")}
              >
                {wildlifeExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            {partyExperiences.length > 0 && (
              <HorizontalScrollRow 
                title="Nightlife & parties"
                onTitleClick={() => navigate("/experiences?category=party")}
              >
                {partyExperiences.map((experience) => (
                  <MobileExperienceCard key={experience.id} experience={experience} />
                ))}
              </HorizontalScrollRow>
            )}

            <HorizontalScrollRow 
              title="Curated collections"
              onTitleClick={() => navigate("/itineraries")}
            >
              {itineraries.slice(0, 6).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>
          </>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <MobileBottomNav onSearchClick={() => setMobileSearchOpen(true)} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
