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

const tags = ["All", "Beaches", "Water Sports", "Nightlife", "Wildlife", "Adventure", "Food", "Culture", "Wellness"];

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
      onClick={() => navigate(`/public-itinerary/${itinerary.id}`)}
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

// Map tag names to experience categories for filtering
const tagToCategoryMap: Record<string, string> = {
  "Beaches": "Beach",
  "Water Sports": "Adventure",
  "Nightlife": "Nightlife",
  "Wildlife": "Wildlife",
  "Adventure": "Adventure",
  "Food": "Food",
  "Culture": "Culture",
  "Wellness": "Wellness",
};

const itineraryMatchesCategory = (itinerary: any, category: string) => {
  return itinerary.experiences?.some((exp: any) => exp.category === category);
};

const ItinerariesPage = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const tagScrollRef = useRef<HTMLDivElement>(null);
  
  const getBaseItineraries = () => {
    if (filter === 'popular') return getPopularItineraries();
    if (filter === 'fave') return getFaveItineraries();
    return publicItinerariesData;
  };

  const allItineraries = getBaseItineraries();

  // Filter by active tag
  const itineraries = activeTag === "All" 
    ? allItineraries 
    : allItineraries.filter(it => itineraryMatchesCategory(it, tagToCategoryMap[activeTag] || activeTag));

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

    const handleTagClick = (tag: string, index: number) => {
      setActiveTag(tag);
      const container = tagScrollRef.current;
      if (container) {
        const buttons = container.querySelectorAll('button');
        const btn = buttons[index];
        if (btn) {
          const containerRect = container.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          // Scroll selected tag to the start (right next to All)
          const scrollLeft = container.scrollLeft + (btnRect.left - containerRect.left);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };

    const tagPills = (
      <div className="flex items-center">
        {/* Fixed "All" button */}
        <button
          onClick={() => setActiveTag("All")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border flex-shrink-0 mr-2",
            activeTag === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/80 text-foreground border-border/50"
          )}
        >
          All
        </button>
        {/* Scrollable tags */}
        <div ref={tagScrollRef} className="overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: 'none' }}>
          <div className="inline-flex gap-2" style={{ paddingRight: '16px' }}>
            {tags.filter(t => t !== "All").map((tag, index) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag, index)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border",
                  activeTag === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/80 text-foreground border-border/50"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <MobileShell headerContent={tagPills} hideAvatar>
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
            <span className="text-muted-foreground text-sm">({allItineraries.length})</span>
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
            {itineraries.map((itinerary) => (
              <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>

          {itineraries.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">No itineraries found</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ItinerariesPage;
