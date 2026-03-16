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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: publicItinerariesList = [], isLoading: itinerariesLoading } = usePublicItineraries();

  // Fetch from DB — no collection_type filter so it works for itineraries collections
  const { data: dbCollection, isLoading: dbCollectionLoading } = useQuery({
    queryKey: ["itinerary-collection-by-slug", slug, publicItinerariesList.length],
    enabled: !!slug,
    queryFn: async () => {
      const { data: collectionRow } = await supabase
        .from("collections")
        .select("id, name, slug, description, is_active")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();

      if (!collectionRow) return null;

      // Try collection_items first
      const { data: linkRows } = await (supabase as any)
        .from("collection_items")
        .select("item_id, position")
        .eq("collection_id", collectionRow.id)
        .eq("item_type", "itinerary")
        .order("position", { ascending: true });

      let linkedItems = (linkRows || [])
        .map((row: any) => publicItinerariesList.find((it: any) => it.dbId === row.item_id))
        .filter(Boolean);

      // If no linked items, show ALL itineraries as fallback (this is the fix for top-in-city)
      if (linkedItems.length === 0) {
        linkedItems = publicItinerariesList;
      }

      return {
        title: collectionRow.name,
        description: collectionRow.description || "",
        items: linkedItems,
      };
    },
  });

  const hasCollection = !!dbCollection;
  const collectionTitle = dbCollection?.title || slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Collection";
  const collectionDescription = dbCollection?.description || "";
  const featuredItems = dbCollection?.items || [];
  const isInitialLoading = (dbCollectionLoading || itinerariesLoading) && !hasCollection;

  if (isInitialLoading) {
    return isMobile ? (
      <MobileShell hideAvatar>
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    ) : (
      <MainLayout>
        <div className="flex justify-center items-center py-24">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!hasCollection && !itinerariesLoading) {
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
          <title>{collectionTitle} — Curated Itineraries | Swam</title>
          <meta name="description" content={collectionDescription} />
          <link rel="canonical" href={`https://guiduuid.lovable.app/collections/itineraries/${slug}`} />
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
            {collectionTitle}
          </h1>
          {collectionDescription && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {collectionDescription}
            </p>
          )}
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
        <title>{collectionTitle} — Curated Itineraries | Swam</title>
        <meta name="description" content={collectionDescription} />
        <link rel="canonical" href={`https://guiduuid.lovable.app/collections/itineraries/${slug}`} />
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
                <h1 className="text-xl lg:text-2xl font-bold">{collectionTitle}</h1>
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
            {collectionDescription && <p className="text-muted-foreground mb-6 max-w-2xl">{collectionDescription}</p>}
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
