import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicItinerariesData, getPopularItineraries, getFaveItineraries } from "@/data/itinerariesData";
import { ArrowLeft, Search, Users, Heart, Layers, X, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Grid card matching homepage itinerary card size (3:2 aspect)
const MobileGridItineraryCard = ({ itinerary }: { itinerary: any }) => {
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
      className="cursor-pointer active:scale-[0.98] transition-transform"
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

const ItinerariesPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  const getItineraries = () => {
    if (filter === 'popular') return getPopularItineraries();
    if (filter === 'fave') return getFaveItineraries();
    return publicItinerariesData;
  };

  const itineraries = getItineraries();
  
  const filteredItineraries = itineraries.filter((itinerary) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      itinerary.name.toLowerCase().includes(q) ||
      itinerary.creatorName?.toLowerCase().includes(q)
    );
  });

  const getTitle = () => {
    if (filter === 'popular') return 'Most Popular';
    if (filter === 'fave') return 'Staff Picks';
    return 'All Itineraries';
  };

  const getIcon = () => {
    if (filter === 'fave') return <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
    return <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
  };

  if (isMobile) {
    return (
      <MobileShell
        headerContent={
          <h1 className="text-lg font-bold text-foreground">{getTitle()}</h1>
        }
      >
        {/* Search */}
        <div className="mx-4 mb-4">
          <div className="flex items-center bg-muted/60 border border-border/50 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-foreground/60 mr-2.5 shrink-0" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search itineraries..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-foreground/50"
              style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="ml-2 p-1 hover:bg-muted rounded-full">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Grid - same card size as homepage */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredItineraries.map((itinerary) => (
              <MobileGridItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>

          {filteredItineraries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No itineraries found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h1 className="text-lg md:text-2xl font-bold">{getTitle()}</h1>
            </div>
            <span className="text-muted-foreground text-sm">({itineraries.length})</span>
          </div>
          
          <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md">
            <Search className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground mr-2 md:mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search itineraries..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm md:text-base placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {filteredItineraries.map((itinerary) => (
              <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>

          {filteredItineraries.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">No itineraries found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ItinerariesPage;
