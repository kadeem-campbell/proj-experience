import { useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicItinerariesData, getPopularItineraries, getFaveItineraries } from "@/data/itinerariesData";
import { ArrowLeft, Search, Users, Heart, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";



// Horizontal scroll row - identical to homepage
const HorizontalScrollRow = ({ 
  title, 
  children 
}: { 
  title: string;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mb-8">
      <div className="mb-4" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
      </div>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card for horizontal scroll - 3:2 aspect, same as homepage
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
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
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
          {itinerary.creatorName || 'Unknown creator'}
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
  const navigate = useNavigate();
  
  const getBaseItineraries = () => {
    if (filter === 'popular') return getPopularItineraries();
    if (filter === 'fave') return getFaveItineraries();
    return publicItinerariesData;
  };

  const allItineraries = getBaseItineraries();
  const itineraries = allItineraries;

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
    const popularItems = itineraries.filter(i => i.tag === 'popular').slice(0, 10);
    const faveItems = itineraries.filter(i => i.tag === 'fave').slice(0, 10);
    const recentItems = [...itineraries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    const zanzibarItems = itineraries.filter(i => i.name.toLowerCase().includes('zanzibar')).slice(0, 10);
    const safariItems = itineraries.filter(i => 
      i.name.toLowerCase().includes('safari') || i.name.toLowerCase().includes('serengeti') || i.name.toLowerCase().includes('maasai')
    ).slice(0, 10);
    const beachItems = itineraries.filter(i => 
      i.name.toLowerCase().includes('beach') || i.name.toLowerCase().includes('island') || i.name.toLowerCase().includes('diani') || i.name.toLowerCase().includes('mombasa')
    ).slice(0, 10);

    return (
      <MobileShell hideAvatar>
        <div className="mb-6 pt-2" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
        </div>

        {popularItems.length > 0 && (
          <HorizontalScrollRow title="Attractions you can't miss">
            {popularItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}

        {faveItems.length > 0 && (
          <HorizontalScrollRow title="Staff picks">
            {faveItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}

        {zanzibarItems.length > 0 && (
          <HorizontalScrollRow title="Zanzibar getaways">
            {zanzibarItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}

        {beachItems.length > 0 && (
          <HorizontalScrollRow title="Beach & island life">
            {beachItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}

        {safariItems.length > 0 && (
          <HorizontalScrollRow title="Safari adventures">
            {safariItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}

        {recentItems.length > 0 && (
          <HorizontalScrollRow title="Recently added">
            {recentItems.map(it => <MobileItineraryCard key={it.id} itinerary={it} />)}
          </HorizontalScrollRow>
        )}
      </MobileShell>
    );
  }

  // Desktop: featured section fills viewport, rest scrolls
  const popularItems = itineraries.filter(i => i.tag === 'popular');
  const restItems = itineraries.filter(i => i.tag !== 'popular');

  return (
    <MainLayout showSidebar={false}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 lg:px-10 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-muted/70">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                {getIcon()}
                <h1 className="text-xl lg:text-2xl font-bold">{getTitle()}</h1>
              </div>
              <span className="text-muted-foreground text-sm">({allItineraries.length})</span>
            </div>
            <div className="flex items-center bg-muted/50 border border-border/50 rounded-full px-4 py-2 w-80 hover:bg-muted/70 hover:border-border transition-all duration-200">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search itineraries..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Featured section */}
            {popularItems.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-4">Attractions you can't miss</h2>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {popularItems.slice(0, 10).map((itinerary) => (
                    <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest of itineraries */}
            {restItems.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">All itineraries</h2>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                  {restItems.map((itinerary) => (
                    <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
                </div>
              </div>
            )}

            {itineraries.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No itineraries found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ItinerariesPage;
