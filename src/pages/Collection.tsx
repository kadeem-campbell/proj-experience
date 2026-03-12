import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { Button } from "@/components/ui/button";
import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { ArrowLeft, Layers, Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

// Collection definitions - slug → metadata + filter
const collectionDefinitions: Record<string, { title: string; description: string; filter: (items: any[]) => any[] }> = {
  "attractions-you-cant-miss": {
    title: "Attractions You Can't Miss",
    description: "The most iconic experiences and must-visit destinations curated by our team.",
    filter: (items) => items.filter(i => i.tag === 'popular'),
  },
  "staff-picks": {
    title: "Staff Picks",
    description: "Hand-picked itineraries our team loves — tried, tested, and unforgettable.",
    filter: (items) => items.filter(i => i.tag === 'fave'),
  },
  "zanzibar-getaways": {
    title: "Zanzibar Getaways",
    description: "Island magic — the best itineraries for exploring Zanzibar's beaches, culture, and spice.",
    filter: (items) => items.filter(i => i.name?.toLowerCase().includes('zanzibar')),
  },
  "popular-this-week": {
    title: "Popular This Week",
    description: "Trending right now — the itineraries travellers are loving this week.",
    filter: (items) => items.filter(i => i.tag === 'popular'),
  },
  "beach-island-life": {
    title: "Beach & Island Life",
    description: "Sun, sand, and sea — curated coastal escapes and island adventures.",
    filter: (items) => items.filter(i =>
      i.name?.toLowerCase().includes('beach') || i.name?.toLowerCase().includes('island') || i.name?.toLowerCase().includes('diani') || i.name?.toLowerCase().includes('mombasa')
    ),
  },
  "safari-adventures": {
    title: "Safari Adventures",
    description: "Wild encounters and open plains — the best safari itineraries across East Africa.",
    filter: (items) => items.filter(i =>
      i.name?.toLowerCase().includes('safari') || i.name?.toLowerCase().includes('serengeti') || i.name?.toLowerCase().includes('maasai')
    ),
  },
  "curated-by-locals": {
    title: "Curated by Locals",
    description: "Insider knowledge — itineraries crafted by people who know these places best.",
    filter: (items) => items.filter(i => i.tag === 'fave'),
  },
  "weekend-getaways": {
    title: "Weekend Getaways",
    description: "Short on time? These itineraries pack the best into a quick escape.",
    filter: (items) => items.filter(i => i.name?.toLowerCase().includes('zanzibar') || i.name?.toLowerCase().includes('weekend') || i.name?.toLowerCase().includes('escape')),
  },
};

// Horizontal scroll row for remaining sections
const HorizontalScrollRow = ({ title, onTitleClick, children, titleClassName }: { title: string; onTitleClick?: () => void; children: React.ReactNode; titleClassName?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mb-8">
      <button onClick={onTitleClick} className="mb-4 flex items-center gap-1.5 w-full text-left" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <h2 className={cn("text-base font-bold truncate", titleClassName || "text-foreground")}>{title}</h2>
      </button>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-flex gap-3 snap-x snap-mandatory" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card
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
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer"
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
          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-colors",
          liked ? "bg-black/40 border border-white/10" : "bg-background/70"
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

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: publicItinerariesList = [] } = usePublicItineraries();

  const collection = slug ? collectionDefinitions[slug] : null;

  const { featuredItems, remainingSections } = useMemo(() => {
    if (!collection) return { featuredItems: [], remainingSections: [] };
    const featured = collection.filter(publicItinerariesList);
    const featuredIds = new Set(featured.map((i: any) => i.id));
    const remaining = publicItinerariesList.filter((i: any) => !featuredIds.has(i.id));

    // Build other sections from remaining
    const sections: { key: string; title: string; items: any[] }[] = [];
    const otherCollections = Object.entries(collectionDefinitions).filter(([k]) => k !== slug);
    for (const [key, def] of otherCollections) {
      const items = def.filter(remaining).slice(0, 10);
      if (items.length > 0) {
        sections.push({ key, title: def.title, items });
      }
    }
    // Deduplicate - only show unique sections
    const seen = new Set<string>();
    const uniqueSections = sections.filter(s => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    }).slice(0, 4);

    return { featuredItems: featured, remainingSections: uniqueSections };
  }, [collection, slug]);

  if (!collection) {
    return isMobile ? (
      <MobileShell hideAvatar>
        <div className="text-center py-16 px-4">
          <p className="text-lg font-semibold text-foreground mb-2">Collection not found</p>
          <Button variant="outline" onClick={() => navigate('/itineraries')}>Browse all itineraries</Button>
        </div>
      </MobileShell>
    ) : (
      <MainLayout>
        <div className="text-center py-16">
          <p className="text-lg font-semibold mb-2">Collection not found</p>
          <Button variant="outline" onClick={() => navigate('/itineraries')}>Browse all itineraries</Button>
        </div>
      </MainLayout>
    );
  }

  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        <Helmet>
          <title>{collection.title} — Curated Itineraries | Swam</title>
          <meta name="description" content={collection.description} />
          <link rel="canonical" href={`https://guiduuid.lovable.app/itinerary-collections/${slug}`} />
        </Helmet>

        {/* Hero header */}
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-foreground leading-tight tracking-tight">
            {collection.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {collection.description}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {featuredItems.length} itineraries
          </p>
        </div>

        {/* Featured items in grid */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            {featuredItems.map((it: any) => (
              <MobileItineraryCard key={it.id} itinerary={it} />
            ))}
          </div>
        </div>

        {/* Divider + continued discovery */}
        {remainingSections.length > 0 && (
          <>
            <div className="flex-1 -mb-20 pb-20 [&_h3]:text-white [&_p]:text-white/60 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60" style={{ backgroundColor: '#811b25' }}>
              <div className="pt-8 pb-4 px-4 text-center">
                <span className="text-xs uppercase tracking-wider text-white/80">
                  More itineraries to explore
                </span>
              </div>

              {remainingSections.map(section => (
                <HorizontalScrollRow
                  key={section.key}
                  title={section.title}
                  onTitleClick={() => navigate(`/itinerary-collections/${section.key}`)}
                  titleClassName="text-white"
                >
                  {section.items.map((it: any) => (
                    <MobileItineraryCard key={it.id} itinerary={it} />
                  ))}
                </HorizontalScrollRow>
              ))}
              <div className="pb-4" />
            </div>
          </>
        )}
      </MobileShell>
    );
  }

  // Desktop
  const filteredFeatured = searchQuery.trim()
    ? featuredItems.filter((i: any) => i.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : featuredItems;

  return (
    <MainLayout>
      <Helmet>
        <title>{collection.title} — Curated Itineraries | Swam</title>
        <meta name="description" content={collection.description} />
        <link rel="canonical" href={`https://guiduuid.lovable.app/itinerary-collections/${slug}`} />
      </Helmet>

      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 lg:px-10 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Link to="/itineraries">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-muted/70">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Collection</p>
                <h1 className="text-xl lg:text-2xl font-bold">{collection.title}</h1>
              </div>
              <span className="text-muted-foreground text-sm">({featuredItems.length})</span>
            </div>
            <div className="flex items-center bg-muted/50 border border-border/50 rounded-full px-4 py-2 w-80 hover:bg-muted/70 hover:border-border transition-all duration-200">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this collection..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
          <div className="max-w-[1600px] mx-auto">
            <p className="text-muted-foreground mb-6 max-w-2xl">{collection.description}</p>
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredFeatured.map((itinerary: any) => (
                <PublicItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </div>
            {filteredFeatured.length === 0 && (
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

export default CollectionPage;
