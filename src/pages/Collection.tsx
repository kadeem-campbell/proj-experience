import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/button";
import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { useExperiencesData } from "@/hooks/useExperiencesData";
import { ArrowLeft, Layers, Heart, Search, MapPin, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { SEOHead, createCollectionJsonLd } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateExperienceUrl } from "@/utils/slugUtils";

// Itinerary card for mobile
const MobileItineraryCard = ({ itinerary }: { itinerary: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', { id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage, creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3) });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer" onClick={() => navigate(`/itineraries/${itinerary.slug || itinerary.id}`)}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn("absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-colors", liked ? "bg-black/40 border border-white/10" : "bg-background/70")}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xl shadow-sm flex items-center gap-1">
          <Layers className="w-3 h-3 text-foreground" /><span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{itinerary.creatorName || 'Unknown creator'}</p>
      </div>
    </div>
  );
};

// Experience card for mobile collections
const MobileExpCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', { id: experience.id, title: experience.title, videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category });
    } else { setLocalLiked(!localLiked); }
  };

  return (
    <div className="cursor-pointer" onClick={() => navigate(generateExperienceUrl(experience.location || '', experience.title, experience.slug))}>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn("absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-2xl shadow-lg transition-all active:scale-90", liked ? "bg-black/40 border border-white/10" : "bg-white/10 border border-white/15")}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-white/90")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
          <ItinerarySelector experienceId={experience.id} experienceData={{ id: experience.id, title: experience.title, creator: experience.creator || '', videoThumbnail: experience.videoThumbnail || '', category: experience.category || '', location: experience.location || '', price: experience.price || '' }} onAdd={() => { setShowTick(true); setTimeout(() => setShowTick(false), 1500); }}>
            <button className={cn("w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm active:scale-90", showTick ? "bg-primary/90" : "bg-white/80")}>
              {showTick ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-foreground" />}
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{experience.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{experience.location}</p>
        {experience.price && <p className="text-xs text-muted-foreground">{experience.price} typical</p>}
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
  const allExperiences = useExperiencesData();

  // Fetch destinations for city filtering
  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations-for-collections"],
    queryFn: async () => {
      const { data } = await supabase.from("destinations").select("id, name, slug, flag_emoji, legacy_city_id").eq("is_active", true).order("name");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: dbCollection, isLoading: dbCollectionLoading } = useQuery({
    queryKey: ["unified-collection", slug, publicItinerariesList.length, allExperiences.length],
    enabled: !!slug,
    queryFn: async () => {
      const { data: collectionRow } = await supabase
        .from("collections")
        .select("id, name, slug, description, collection_type, content_type, city_id, is_active")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();

      if (!collectionRow) return null;

      const contentType = collectionRow.collection_type || 'experiences';

      // Try collection_items for itineraries
      const { data: linkRows } = await (supabase as any)
        .from("collection_items")
        .select("item_id, item_type, position")
        .eq("collection_id", collectionRow.id)
        .order("position", { ascending: true });

      // Try collection_experiences for experiences
      const { data: expLinks } = await (supabase as any)
        .from("collection_experiences")
        .select("experience_id, display_order")
        .eq("collection_id", collectionRow.id)
        .order("display_order", { ascending: true });

      if (contentType === 'itineraries') {
        let linkedItems = (linkRows || [])
          .filter((r: any) => r.item_type === 'itinerary')
          .map((row: any) => publicItinerariesList.find((it: any) => it.dbId === row.item_id || it.id === row.item_id))
          .filter(Boolean);

        // If no linked items, show all itineraries (optionally filtered by city)
        if (linkedItems.length === 0) {
          linkedItems = publicItinerariesList;
          // If collection has a city_id, filter by it
          if (collectionRow.city_id) {
            linkedItems = linkedItems.filter((it: any) => it.cityId === collectionRow.city_id);
          }
        }

        return { 
          title: collectionRow.name, 
          description: collectionRow.description || "", 
          contentType, 
          items: linkedItems,
          cityId: collectionRow.city_id,
        };
      } else {
        // Experience collection: check both collection_items and collection_experiences
        const itemExpIds = (linkRows || [])
          .filter((r: any) => r.item_type === 'experience' || r.item_type === 'product')
          .map((row: any) => row.item_id);
        const ceExpIds = (expLinks || []).map((r: any) => r.experience_id);
        const allExpIds = [...new Set([...itemExpIds, ...ceExpIds])];

        let linkedItems = allExpIds
          .map((id: string) => allExperiences.find((e: any) => e.id === id))
          .filter(Boolean);

        if (linkedItems.length === 0) {
          linkedItems = allExperiences;
          if (collectionRow.city_id) {
            linkedItems = linkedItems.filter((e: any) => e.cityId === collectionRow.city_id);
          }
          linkedItems = linkedItems.slice(0, 30);
        }

        return { 
          title: collectionRow.name, 
          description: collectionRow.description || "", 
          contentType, 
          items: linkedItems,
          cityId: collectionRow.city_id,
        };
      }
    },
  });

  // City filter for "top-in-city" style dynamic collections
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const hasCollection = !!dbCollection;
  const rawTitle = dbCollection?.title || slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Collection";
  const selectedDest = destinations.find(d => d.id === selectedCityId);
  const collectionTitle = rawTitle.includes('{city}') 
    ? rawTitle.replace('{city}', selectedDest?.name || 'All Destinations') 
    : rawTitle;
  const collectionDescription = dbCollection?.description || "";
  const contentType = dbCollection?.contentType || 'experiences';
  const isInitialLoading = (dbCollectionLoading || itinerariesLoading) && !hasCollection;

  // Filter items by selected city
  const featuredItems = useMemo(() => {
    const items = dbCollection?.items || [];
    if (!selectedCityId) return items;
    
    if (contentType === 'itineraries') {
      return items.filter((it: any) => {
        // Match by cityId (legacy city_id on public_itineraries)
        if (it.cityId === selectedCityId) return true;
        // Also check legacy_city_id match via destinations
        const dest = destinations.find(d => d.id === selectedCityId);
        if (dest?.legacy_city_id && it.cityId === dest.legacy_city_id) return true;
        // Name match
        if (dest && it.name?.toLowerCase().includes(dest.name.toLowerCase())) return true;
        return false;
      });
    }
    return items.filter((e: any) => {
      const dest = destinations.find(d => d.id === selectedCityId);
      if (!dest) return true;
      return (e.location || '').toLowerCase().includes(dest.name.toLowerCase()) || e.cityId === selectedCityId;
    });
  }, [dbCollection?.items, selectedCityId, contentType, destinations]);

  const filteredItems = searchQuery.trim()
    ? featuredItems.filter((i: any) => (i.name || i.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : featuredItems;

  // Show city filter chips if this is a dynamic collection (name contains {city} or no city_id)
  const isDynamic = rawTitle.includes('{city}') || !dbCollection?.cityId;

  if (isInitialLoading) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideAvatar: true } : {})}>
        <div className="flex justify-center items-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      </Wrapper>
    );
  }

  if (!hasCollection && !itinerariesLoading) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideAvatar: true } : {})}>
        <div className="text-center py-16 px-4">
          <p className="text-lg font-semibold text-foreground mb-2">Collection not found</p>
          <Button variant="outline" onClick={() => navigate('/')}>Back to home</Button>
        </div>
      </Wrapper>
    );
  }

  const seoBlock = (
    <Helmet>
      <title>{collectionTitle} — Curated Collection | Swam</title>
      <meta name="description" content={collectionDescription || `${collectionTitle} — curated collection on Swam`} />
      <link rel="canonical" href={`https://swam.app/collections/${slug}`} />
    </Helmet>
  );

  const cityChips = isDynamic && destinations.length > 0 ? (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => setSelectedCityId(null)}
        className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", !selectedCityId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
      >
        All
      </button>
      {destinations.slice(0, 10).map(dest => (
        <button
          key={dest.id}
          onClick={() => setSelectedCityId(selectedCityId === dest.id ? null : dest.id)}
          className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1", selectedCityId === dest.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
        >
          {dest.flag_emoji && <span>{dest.flag_emoji}</span>}
          {dest.name}
        </button>
      ))}
    </div>
  ) : null;

  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        {seoBlock}
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-foreground leading-tight tracking-tight">{collectionTitle}</h1>
          {collectionDescription && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{collectionDescription}</p>}
          <p className="text-xs text-muted-foreground/70 mt-2">{filteredItems.length} {contentType === 'itineraries' ? 'itineraries' : 'experiences'}</p>
        </div>
        {cityChips && <div className="px-4 mb-4">{cityChips}</div>}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item: any) =>
              contentType === 'itineraries'
                ? <MobileItineraryCard key={item.id} itinerary={item} />
                : <MobileExpCard key={item.id} experience={item} />
            )}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No items in this collection yet</p>
            </div>
          )}
        </div>
      </MobileShell>
    );
  }

  // Desktop
  return (
    <MainLayout>
      {seoBlock}
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 lg:px-10 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Link to={contentType === 'itineraries' ? '/itineraries' : '/things-to-do'}>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-muted/70"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Collection</p>
                <h1 className="text-xl lg:text-2xl font-bold">{collectionTitle}</h1>
              </div>
              <span className="text-muted-foreground text-sm">({filteredItems.length})</span>
            </div>
            <div className="flex items-center bg-muted/50 border border-border/50 rounded-full px-4 py-2 w-80 hover:bg-muted/70 hover:border-border transition-all duration-200">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search this collection..." className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
          <div className="max-w-[1600px] mx-auto">
            {collectionDescription && <p className="text-muted-foreground mb-4 max-w-2xl">{collectionDescription}</p>}
            {cityChips && <div className="mb-6">{cityChips}</div>}
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredItems.map((item: any) =>
                contentType === 'itineraries'
                  ? <PublicItineraryCard key={item.id} itinerary={item} />
                  : <ExperienceCard key={item.id} {...item} compact />
              )}
            </div>
            {filteredItems.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">No items found</p></div>}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CollectionPage;
