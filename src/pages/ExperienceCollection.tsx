import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { useExperiencesData } from "@/hooks/useExperiencesData";
import { ArrowLeft, Heart, Plus, Check, Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { slugify } from "@/utils/slugUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Experience collection definitions
const experienceCollectionDefinitions: Record<string, { title: string; description: string; filter: (items: any[]) => any[] }> = {
  "available-next-weekend": {
    title: "Available Next Weekend",
    description: "Experiences you can book and enjoy this coming weekend — no planning stress.",
    filter: (items) => items.slice(0, 40),
  },
  "adventure-awaits": {
    title: "Adventure Awaits",
    description: "Thrilling experiences for the bold — from water sports to mountain climbs.",
    filter: (items) => items.filter(i => i.category === 'Adventure' || i.category === 'Water Sports'),
  },
  "taste-local-flavors": {
    title: "Taste the Local Flavors",
    description: "Food tours, cooking classes, and culinary gems handpicked by locals.",
    filter: (items) => items.filter(i => i.category === 'Food' || i.category === 'Food & Dining'),
  },
  "beach-experiences": {
    title: "Beach Experiences",
    description: "Sun, sand, and sea — the best coastal activities and beach days.",
    filter: (items) => items.filter(i => i.category === 'Beach'),
  },
  "nightlife-experiences": {
    title: "Nightlife Experiences",
    description: "After dark adventures — rooftop bars, live music, beach parties, and more.",
    filter: (items) => items.filter(i => i.category === 'Nightlife' || i.category === 'Party'),
  },
  "wildlife-encounters": {
    title: "Wildlife Encounters",
    description: "Get up close with nature — safaris, bird watching, and conservation visits.",
    filter: (items) => items.filter(i => i.category === 'Wildlife'),
  },
  "cultural-experiences": {
    title: "Cultural Experiences",
    description: "Immerse yourself in local traditions, heritage walks, and artistic discoveries.",
    filter: (items) => items.filter(i => i.category === 'Culture'),
  },
};

// Horizontal scroll row
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

// Experience card
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

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

  const handleAdded = () => {
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1500);
  };

  return (
    <div
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer"
      onClick={() => navigate(`/experiences/${experience.slug || slugify(experience.title)}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-2xl shadow-lg transition-colors",
          liked ? "bg-black/40 border border-white/10" : "bg-white/10 border border-white/15 hover:bg-white/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-white/90")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ItinerarySelector
            experienceId={experience.id}
            experienceData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
            onAdd={handleAdded}
          >
            <button className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm transition-all",
              showTick ? "bg-primary/90" : "bg-white/80"
            )}>
              {showTick ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-foreground" />}
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
      </div>
    </div>
  );
};

// Grid card variant for featured section
const GridExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

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

  return (
    <div
      className="cursor-pointer"
      onClick={() => navigate(`/experiences/${experience.slug || slugify(experience.title)}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-2xl shadow-lg transition-colors",
          liked ? "bg-black/40 border border-white/10" : "bg-white/10 border border-white/15"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-white/90")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ItinerarySelector
            experienceId={experience.id}
            experienceData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
            onAdd={() => { setShowTick(true); setTimeout(() => setShowTick(false), 1500); }}
          >
            <button className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm transition-all",
              showTick ? "bg-primary/90" : "bg-white/80"
            )}>
              {showTick ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-foreground" />}
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
      </div>
    </div>
  );
};

const ExperienceCollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const experiences = useExperiencesData();

  const staticCollection = slug ? experienceCollectionDefinitions[slug] : null;

  const { data: dbCollection } = useQuery({
    queryKey: ['experience-collection-by-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: collectionRow } = await supabase
        .from('collections')
        .select('id, name, slug, description, collection_type, is_active')
        .eq('slug', slug!)
        .eq('is_active', true)
        .eq('collection_type', 'experiences')
        .maybeSingle();

      if (!collectionRow) return null;

      const { data: linkRows } = await (supabase as any)
        .from('collection_experiences')
        .select('display_order, experiences(id, title, creator, video_thumbnail, category, location, price, slug)')
        .eq('collection_id', collectionRow.id)
        .order('display_order', { ascending: true });

      const items = (linkRows || [])
        .map((row: any) => row.experiences)
        .filter(Boolean)
        .map((exp: any) => ({
          id: exp.id,
          title: exp.title,
          creator: exp.creator,
          videoThumbnail: exp.video_thumbnail,
          category: exp.category,
          location: exp.location,
          price: exp.price,
          slug: exp.slug,
        }));

      return {
        title: collectionRow.name,
        description: collectionRow.description || '',
        items,
      };
    },
  });

  const { featuredItems: staticFeaturedItems, remainingSections: staticRemainingSections } = useMemo(() => {
    if (!staticCollection) return { featuredItems: [], remainingSections: [] };
    const featured = staticCollection.filter(experiences);
    const featuredIds = new Set(featured.map((i: any) => i.id));
    const remaining = experiences.filter((i: any) => !featuredIds.has(i.id));

    const sections: { key: string; title: string; items: any[] }[] = [];
    const otherCollections = Object.entries(experienceCollectionDefinitions).filter(([k]) => k !== slug);
    for (const [key, def] of otherCollections) {
      const items = def.filter(remaining).slice(0, 10);
      if (items.length > 0) {
        sections.push({ key, title: def.title, items });
      }
    }
    const seen = new Set<string>();
    const uniqueSections = sections.filter(s => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    }).slice(0, 4);

    return { featuredItems: featured, remainingSections: uniqueSections };
  }, [staticCollection, slug, experiences]);

  const hasCollection = !!dbCollection || !!staticCollection;
  const collectionTitle = dbCollection?.title || staticCollection?.title || 'Collection';
  const collectionDescription = dbCollection?.description || staticCollection?.description || '';
  const featuredItems = dbCollection?.items || staticFeaturedItems;
  const remainingSections = dbCollection ? [] : staticRemainingSections;

  if (!hasCollection) {
    return isMobile ? (
      <MobileShell hideAvatar>
        <div className="text-center py-16 px-4">
          <p className="text-lg font-semibold text-foreground mb-2">Collection not found</p>
          <Button variant="outline" onClick={() => navigate('/experiences')}>Browse all experiences</Button>
        </div>
      </MobileShell>
    ) : (
      <MainLayout>
        <div className="text-center py-16">
          <p className="text-lg font-semibold mb-2">Collection not found</p>
          <Button variant="outline" onClick={() => navigate('/experiences')}>Browse all experiences</Button>
        </div>
      </MainLayout>
    );
  }

  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        <Helmet>
          <title>{collectionTitle} — Curated Experiences | Swam</title>
          <meta name="description" content={collectionDescription} />
          <link rel="canonical" href={`https://guiduuid.lovable.app/experience-collections/${slug}`} />
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
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {collectionDescription}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {featuredItems.length} experiences
          </p>
        </div>

        {/* Featured items in grid */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            {featuredItems.slice(0, 20).map((exp: any) => (
              <GridExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        </div>

        {/* Divider + continued discovery */}
        {remainingSections.length > 0 && (
          <>
            <div className="flex-1 -mb-20 pb-20 [&_h3]:text-white [&_p]:text-white/60 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60" style={{ backgroundColor: '#0d444f' }}>
              <div className="pt-8 pb-4 px-4 text-center">
                <span className="text-xs uppercase tracking-wider text-white/80">
                  More experiences to explore
                </span>
              </div>

              {remainingSections.map(section => (
                <HorizontalScrollRow
                  key={section.key}
                  title={section.title}
                  onTitleClick={() => navigate(`/experience-collections/${section.key}`)}
                  titleClassName="text-white"
                >
                  {section.items.map((exp: any) => (
                    <MobileExperienceCard key={exp.id} experience={exp} />
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
    ? featuredItems.filter((i: any) => i.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : featuredItems;

  return (
    <MainLayout>
      <Helmet>
        <title>{collectionTitle} — Curated Experiences | Swam</title>
        <meta name="description" content={collectionDescription} />
        <link rel="canonical" href={`https://guiduuid.lovable.app/experience-collections/${slug}`} />
      </Helmet>

      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 lg:px-10 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Link to="/experiences">
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
            <p className="text-muted-foreground mb-6 max-w-2xl">{collectionDescription}</p>
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredFeatured.map((exp: any) => (
                <GridExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
            {filteredFeatured.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No experiences found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExperienceCollectionPage;
