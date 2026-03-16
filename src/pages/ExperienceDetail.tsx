import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SEOHead, createExperienceJsonLd } from "@/components/SEOHead";
import { MobileShell } from "@/components/MobileShell";
import { useDbExperiences, DbExperience } from "@/hooks/useDbExperiences"; // kept for backward compat during migration
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreators } from "@/hooks/useAppData";
import { useProductBySlug, useProductOptions, useProductHosts, useDestinationBySlug } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateProductSchema } from "@/services/schemaGenerator";
import { usePoiBySlug } from "@/hooks/usePoiBySlug";
import PoiDetail from "@/pages/PoiDetail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Heart,
  MessageCircle,
  Flame,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Calendar,
  Zap,
  CloudSun,
  HelpCircle,
  Send,
  ThumbsUp
} from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SocialVideoEmbed, TikTokVideo } from "@/components/SocialVideoEmbed";
import { ShareDrawer } from "@/components/ShareDrawer";
import { IncludedInItineraries, PairingBlock, BestForBlock, SaveFollowBar } from "@/components/ExperienceDecisionBlocks";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { slugify, generateProductPageUrl } from "@/utils/slugUtils";
import { AuthModal } from "@/components/AuthModal";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";

import jetskiImage from "@/assets/jetski-experience.jpg";

const categoryIconMap: Record<string, string> = {
  "Beach": catBeaches,
  "Adventure": catAdventure,
  "Party": catNightlife,
  "Wildlife": catSafari,
  "Food": catFood,
  "Water Sports": catAdventure,
  "Nightlife": catNightlife,
  "Culture": catNature,
};

// Questions Section (renamed from FAQ)
const QuestionsSection = ({ faqs, experienceId }: { faqs: any[]; experienceId: string }) => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [localFaqs, setLocalFaqs] = useState(faqs || []);

  const handleAsk = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowAskForm(true);
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    setLocalFaqs(prev => [...prev, { q: newQuestion.trim(), a: "", likes: 0, pending: true }]);
    setNewQuestion("");
    setShowAskForm(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Questions</h2>
        <button
          onClick={handleAsk}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Ask
        </button>
      </div>

      {showAskForm && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this experience..."
            className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none"
            rows={2}
            style={{ fontSize: '16px' }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowAskForm(false)} className="text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleSubmitQuestion} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <Send className="w-3 h-3" />
              Submit
            </button>
          </div>
        </div>
      )}

      {localFaqs.length > 0 ? (
        <div className="space-y-3">
          {localFaqs.map((faq: any, index: number) => (
            <div key={index} className="p-3.5 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  {faq.a ? (
                    <p className="text-sm text-muted-foreground mt-1.5">{faq.a}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Awaiting answer from the community</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {faq.likes || 0}
                    </button>
                    {isAuthenticated && !faq.a && (
                      <button className="text-xs text-primary font-medium">Answer</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4 rounded-xl bg-muted/30 border border-border/50">
          <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No questions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Be the first to ask!</p>
        </div>
      )}

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default function ExperienceDetail() {
  const { id, location: locationParam, legacySlug, slug, destination: destParam, area: areaParam } = useParams<{ id?: string; location?: string; legacySlug?: string; slug?: string; destination?: string; area?: string }>() as any;
  const navigate = useNavigate();
  const { itineraries, isInItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const { data: dbExperiences, isLoading: dbExperiencesLoading } = useDbExperiences();
  const { data: allCreators = [] } = useCreators();
  const { trackPageView, trackClick } = useInteractions();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [justAdded, setJustAdded] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [likeCountDelta, setLikeCountDelta] = useState(0);
  const isMobile = useIsMobile();

  // Resolve the slug from any route pattern
  // For /things-to-do/:destination (when ThingsToDo delegates), destParam IS the slug
  const resolvedSlug = slug || legacySlug || destParam || id || '';

  // Try to find as a product first (new entity system)
  const { data: product, isLoading: productLoading } = useProductBySlug(resolvedSlug);
  const { data: productOptions = [] } = useProductOptions(product?.id || '');
  const { data: productHosts = [] } = useProductHosts(product?.id || '');
  const { data: productDestination } = useDestinationBySlug(destParam || '');

  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/things-to-do');
    }
  };

  const experience = useMemo(() => {
    // First priority: legacy experiences table (has full data with location, price, category)
    const fromDb = (db: DbExperience) => ({
      id: db.id,
      title: db.title,
      creator: db.creator,
      videoThumbnail: db.video_thumbnail,
      videoUrl: db.video_url,
      category: db.category,
      location: db.location,
      description: db.description,
      duration: db.duration,
      groupSize: db.group_size,
      rating: db.rating,
      price: db.price,
      highlights: db.highlights,
      gallery: db.gallery.length > 0 ? db.gallery : [db.video_thumbnail],
      bestTime: db.best_time,
      weather: db.weather,
      meetingPoints: db.meeting_points,
      faqs: db.faqs,
      tiktokVideos: db.tiktok_videos,
      instagramEmbed: db.instagram_embed,
      socialLinks: db.social_links,
      likeCount: db.like_count,
      slug: db.slug,
      isProduct: false,
    });

    if (dbExperiences && dbExperiences.length > 0) {
      if (resolvedSlug) {
        const dbMatch = dbExperiences.find(e => e.slug === resolvedSlug || slugify(e.title) === resolvedSlug);
        if (dbMatch) return fromDb(dbMatch);
      }
      if (locationParam && legacySlug) {
        const dbMatch = dbExperiences.find(e => e.slug === legacySlug || slugify(e.title) === legacySlug);
        if (dbMatch) return fromDb(dbMatch);
      }
      if (id) {
        const dbMatch = dbExperiences.find(e => e.id === id);
        if (dbMatch) return fromDb(dbMatch);
      }
    }

    // Second: try product table (new entity system)
    if (product) {
      return {
        id: product.id,
        title: product.title,
        creator: '',
        videoThumbnail: product.cover_image,
        videoUrl: product.video_url,
        category: '',
        location: productDestination?.name || '',
        description: product.description,
        duration: product.duration,
        groupSize: '',
        rating: product.rating,
        price: productOptions.length > 0
          ? productOptions[0].price_options.map(p => `${p.currency} ${p.amount}`).join(' / ')
          : '',
        highlights: product.highlights || [],
        gallery: (product.gallery && product.gallery.length > 0) ? product.gallery : (product.cover_image ? [product.cover_image] : []),
        bestTime: product.best_time,
        weather: product.weather,
        meetingPoints: product.meeting_points || [],
        faqs: [],
        tiktokVideos: [],
        instagramEmbed: '',
        socialLinks: {},
        likeCount: product.like_count,
        slug: product.slug,
        isProduct: true,
      };
    }

    return null;
  }, [id, locationParam, legacySlug, resolvedSlug, product, productOptions, productDestination, dbExperiences]);

  // Analytics: track page view
  useEffect(() => {
    if (experience) {
      trackPageView(
        (experience as any).isProduct ? 'product' : 'experience',
        experience.id,
        window.location.pathname
      );
    }
  }, [experience?.id]);

  const liked = experience ? (isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked) : false;

  const handleLikeClick = async () => {
    if (!experience) return;
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      const wasLiked = isDbLiked(experience.id, 'experience');
      setLikeCountDelta(prev => prev + (wasLiked ? -1 : 1));
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id, title: experience.title,
        videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category
      });
    } else {
      setPendingAction('like');
      setShowAuthModal(true);
    }
  };

  const likedByCount = (experience?.likeCount || 0) + likeCountDelta;

  const shareUrl = useMemo(() => {
    if (!experience) return window.location.href;
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    if ((experience as any).isProduct && productDestination) {
      return `${baseUrl}/things-to-do/${productDestination.slug}/${experience.slug || ''}`;
    }
    return `${baseUrl}${generateProductPageUrl(experience.location, experience.title, (experience as any).slug)}`;
  }, [experience, productDestination]);

  useEffect(() => {
    if (experience) {
      document.title = `${experience.title}${experience.location ? ' in ' + experience.location : ''} | Things to Do | swam.app`;
    }
    return () => { document.title = 'Discover Experiences in East Africa | swam.app'; };
  }, [experience]);

  // Generate JSON-LD: prefer product schema if available
  const experienceJsonLd = useMemo(() => {
    if (product && productOptions) {
      return generateProductSchema(product, productOptions, productHosts, productDestination);
    }
    if (!experience) return null;
    return createExperienceJsonLd({
      title: experience.title,
      description: experience.description,
      location: experience.location,
      price: experience.price,
      rating: experience.rating,
      image: experience.videoThumbnail,
      url: shareUrl,
      duration: experience.duration,
      category: experience.category,
    });
  }, [experience, product, productOptions, productHosts, productDestination, shareUrl]);


  // Check if sections have content
  const hasHighlights = experience?.highlights && experience.highlights.length > 0;
  const hasMeetingPoints = experience?.meetingPoints && experience.meetingPoints.length > 0;
  const hasSocialContent = (experience?.tiktokVideos && experience.tiktokVideos.length > 0) || !!experience?.instagramEmbed;
  const hasDescription = !!experience?.description?.trim();
  const hasCreators = (() => {
    if (!experience?.creator) return false;
    const raw = experience.creator.trim();
    return raw.length > 0;
  })();

  // Check for POI match when no experience/product found
  const { data: poiMatch, isLoading: poiLoading } = usePoiBySlug(
    (!experience && !dbExperiencesLoading && !productLoading) ? resolvedSlug : ""
  );

  if (!experience && (dbExperiencesLoading || productLoading)) {
    return isMobile ? (
      <MobileShell hideTopBar>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    ) : (
      <div className="flex justify-center items-center min-h-screen bg-background w-full">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If no experience/product found but POI exists, render POI page
  if (!experience && poiMatch) {
    return <PoiDetail />;
  }

  // Still loading POI check
  if (!experience && poiLoading) {
    return isMobile ? (
      <MobileShell hideTopBar>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    ) : (
      <div className="flex justify-center items-center min-h-screen bg-background w-full">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!experience) {
    if (isMobile) {
      return (
        <MobileShell hideTopBar>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-3">Experience not found</h1>
              <Link to="/"><Button size="sm">Back to Discover</Button></Link>
            </div>
          </div>
        </MobileShell>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-background w-full">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-3">Experience not found</h1>
          <Link to="/"><Button size="sm">Back to Discover</Button></Link>
        </div>
      </div>
    );
  }

  const gallery = experience.gallery || [experience.videoThumbnail];
  const categoryIcon = categoryIconMap[experience.category];
  const creatorNames = (() => {
    const rawCreator = (experience.creator || '').trim();
    if (!rawCreator) return [] as string[];
    if (rawCreator.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawCreator);
        if (Array.isArray(parsed)) {
          return parsed.map((name: string) => String(name).replace(/^@/, '').trim()).filter(Boolean);
        }
      } catch {}
    }
    const splitNames = rawCreator
      .split(/\r?\n|,|;|\||\s+&\s+|\s+and\s+/i)
      .map((name: string) => name.replace(/^@/, '').trim())
      .filter(Boolean);
    return Array.from(new Set(splitNames));
  })();

  // Resolve creator name to DB username for host profile link
  const getHostUrl = (creatorName: string) => {
    const slug = creatorName.toLowerCase().replace(/\s+/g, '-');
    const match = allCreators.find(c =>
      c.username === creatorName ||
      c.username === slug ||
      (c.display_name || '').toLowerCase() === creatorName.toLowerCase() ||
      (c.display_name || '').toLowerCase().replace(/\s+/g, '-') === slug
    );
    return `/hosts/${match ? match.username : slug}`;
  };


  // Mobile
  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        {experienceJsonLd && (
          <SEOHead
            title={`${experience.title} in ${experience.location}`}
            description={`${experience.title} — ${experience.category} activity in ${experience.location}. ${experience.description?.slice(0, 120) || 'Discover and add to your itinerary.'}`}
            canonicalPath={shareUrl.replace('https://swam.app', '')}
            indexability="public_indexed"
            image={experience.videoThumbnail}
            jsonLd={experienceJsonLd}
          />
        )}
        <div className="bg-background overflow-y-auto">
          {/* Photo Gallery */}
          <div className="relative">
            {gallery.length > 1 ? (
              <PhotoGallery images={gallery} title={experience.title} />
            ) : experience.videoUrl ? (
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <video
                  ref={videoRef}
                  poster={experience.videoThumbnail}
                  className="w-full h-full object-cover"
                  muted loop playsInline autoPlay
                >
                  <source src={experience.videoUrl} type="video/mp4" />
                </video>
              </div>
            ) : (
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={gallery[0]} alt={experience.title} className="w-full h-full object-cover" />
              </div>
            )}
            {/* Top buttons */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button 
                onClick={handleGoBack}
                className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <ShareDrawer title={experience.title} url={shareUrl} onInvite={() => {}}>
                  <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Share2 className="w-5 h-5 text-foreground" />
                  </button>
                </ShareDrawer>
                <button
                  onClick={handleLikeClick}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg",
                    liked && "bg-primary/15"
                  )}
                >
                  <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{experience.title}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>

            {/* Rating + Social */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-semibold text-foreground">{experience.rating}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="w-3.5 h-3.5 fill-primary/30 text-primary/60" />
                <span>Liked by <strong className="text-foreground">{likedByCount}</strong> people</span>
              </div>
            </div>

            {/* Add to Itinerary CTA */}
            <div className="mb-6">
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={{
                  id: experience.id, title: experience.title, creator: experience.creator,
                  videoThumbnail: experience.videoThumbnail, category: experience.category,
                  location: experience.location, price: experience.price || "",
                }}
                onAdd={() => {
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 2000);
                }}
              >
                <Button 
                  size="lg"
                  className={cn(
                    "w-full h-14 rounded-2xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90",
                    justAdded && "animate-pulse"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add to Itinerary
                  </span>
                </Button>
              </ItinerarySelector>
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                {categoryIcon && <img src={categoryIcon} alt="" className="w-5 h-5 object-contain" />}
                <span className="font-medium">{experience.category}</span>
              </div>
              {experience.duration && (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{experience.duration}</span>
                </div>
              )}
              {experience.groupSize && (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{experience.groupSize}</span>
                </div>
              )}
              {(experience.weather || experience.bestTime) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <CloudSun className="w-4 h-4 text-primary" />
                  <span className="font-medium">{(experience.weather || experience.bestTime || "").replace(/[^\w\s,°\-–.]/g, '').trim()}</span>
                </div>
              )}
            </div>

            {/* Prices per person */}
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
              <h3 className="text-base font-semibold mb-2">Average prices per person</h3>
              <span className="text-2xl font-bold text-foreground">{experience.price || "$15 - $75"}</span>
              <p className="text-[11px] text-muted-foreground mt-1.5">Prices are based on local market averages and may vary by operator.</p>
            </div>

            {/* Social Video Embeds - only if content exists */}
            {hasSocialContent && (
              <SocialVideoEmbed 
                experienceTitle={experience.title}
                location={experience.location}
                tiktokVideos={experience.tiktokVideos || []}
                instagramEmbed={experience.instagramEmbed}
                className="mb-6"
              />
            )}

            {/* Description - only if content exists */}
            {hasDescription && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
              </div>
            )}

            {/* Highlights - only if content exists */}
            {hasHighlights && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">What makes it special</h2>
                <div className="grid grid-cols-1 gap-3">
                  {experience.highlights?.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Points - only if content exists */}
            {hasMeetingPoints && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Where to find it</h2>
                <div className="space-y-2">
                  {experience.meetingPoints?.map((point: { name: string; type: string }, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{point.name}</p>
                        <p className="text-xs text-muted-foreground">{point.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hosts - only if content exists */}
            {hasCreators && creatorNames.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Hosts</h2>
                <div className="space-y-2">
                  {creatorNames.map((creatorName: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors"
                      onClick={() => navigate(getHostUrl(creatorName))}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {creatorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">@{creatorName}</p>
                        <p className="text-sm text-muted-foreground">Host</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{experience.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions Section - always shown as fallback */}
            <QuestionsSection faqs={experience.faqs || []} experienceId={experience.id} />

            <div className="h-8" />
          </div>
        </div>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </MobileShell>
    );
  }

  // Desktop
  return (
    <div className="min-h-screen bg-background overflow-y-auto w-full">
        {/* Media Section */}
        <div className="relative">
          {gallery.length > 1 ? (
            <div className="aspect-[3/1] overflow-hidden">
              <PhotoGallery images={gallery} title={experience.title} />
            </div>
          ) : experience.videoUrl ? (
            <div className="relative aspect-[3/1] overflow-hidden bg-muted">
              <video
                ref={videoRef}
                poster={experience.videoThumbnail}
                className="w-full h-full object-cover"
                muted loop playsInline autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={experience.videoUrl} type="video/mp4" />
              </video>
            </div>
          ) : (
            <div className="relative aspect-[3/1] overflow-hidden bg-muted">
              <img src={gallery[0]} alt={experience.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Top buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button 
              onClick={handleGoBack}
              className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <ShareDrawer title={experience.title} url={shareUrl} onInvite={() => {}}>
                <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Share2 className="w-5 h-5 text-foreground" />
                </button>
              </ShareDrawer>
              <button
                onClick={handleLikeClick}
                className={cn(
                  "w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg",
                  liked && "bg-primary/15"
                )}
              >
                <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
              </button>
            </div>
          </div>
          
          {(experience?.likeCount || 0) > 500 && (
            <Badge variant="secondary" className="absolute top-4 left-1/2 -translate-x-1/2 gap-1 text-xs bg-background/80 backdrop-blur-md text-primary border-0 z-10">
              <Flame className="w-3 h-3" />
              Popular
            </Badge>
          )}
        </div>

        {/* Desktop two-column layout */}
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
            <div>
              {/* Desktop Title */}
              <div className="mb-5">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{experience.title}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-base">{experience.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-semibold">{experience.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Heart className="w-3.5 h-3.5 fill-primary/30 text-primary/60" />
                    <span>Liked by <strong className="text-foreground">{likedByCount}</strong> people</span>
                  </div>
                </div>
              </div>

              {/* Info Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  {categoryIcon && <img src={categoryIcon} alt="" className="w-5 h-5 object-contain" />}
                  <span className="font-medium">{experience.category}</span>
                </div>
                {experience.duration && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">{experience.duration}</span>
                  </div>
                )}
                {experience.groupSize && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{experience.groupSize}</span>
                  </div>
                )}
                {(experience.weather || experience.bestTime) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                    <CloudSun className="w-4 h-4 text-primary" />
                    <span className="font-medium">{(experience.weather || experience.bestTime || "").replace(/[^\w\s,°\-–.]/g, '').trim()}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {hasDescription && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
                </div>
              )}

              {hasSocialContent && (
                <SocialVideoEmbed 
                  experienceTitle={experience.title}
                  location={experience.location}
                  tiktokVideos={experience.tiktokVideos || []}
                  instagramEmbed={experience.instagramEmbed}
                  className="mb-6"
                />
              )}

              {/* Highlights */}
              {hasHighlights && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">What makes it special</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {experience.highlights?.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Points */}
              {hasMeetingPoints && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Where to find it</h2>
                  <div className="space-y-2">
                    {experience.meetingPoints?.map((point: { name: string; type: string }, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{point.name}</p>
                          <p className="text-xs text-muted-foreground">{point.type}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hosts */}
              {hasCreators && creatorNames.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Hosts</h2>
                  <div className="space-y-2">
                    {creatorNames.map((creatorName: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(getHostUrl(creatorName))}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {creatorName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">@{creatorName}</p>
                          <p className="text-sm text-muted-foreground">Host</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{experience.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions - always shown */}
              <QuestionsSection faqs={experience.faqs || []} experienceId={experience.id} />
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                {/* Add to Itinerary CTA */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <ItinerarySelector
                    experienceId={experience.id}
                    experienceData={{
                      id: experience.id, title: experience.title, creator: experience.creator,
                      videoThumbnail: experience.videoThumbnail, category: experience.category,
                      location: experience.location, price: experience.price || "",
                    }}
                    onAdd={() => {
                      setJustAdded(true);
                      setTimeout(() => setJustAdded(false), 2000);
                    }}
                  >
                    <Button 
                      size="lg"
                      className={cn(
                        "w-full h-13 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90",
                        justAdded && "animate-pulse"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add to Itinerary
                      </span>
                    </Button>
                  </ItinerarySelector>
                  
                  {/* Like button */}
                  <button
                    onClick={handleLikeClick}
                    className={cn(
                      "w-full mt-3 h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all",
                      liked
                        ? "bg-primary/5 border-primary/20 text-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-primary")} />
                    {liked ? "Liked" : "Like"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground mt-2.5">
                    Liked by <span className="text-primary font-medium">{likedByCount}</span> people
                  </p>
                </div>

                {/* Prices per person */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold mb-2">Average prices per person</p>
                  <span className="text-2xl font-bold text-foreground">{experience.price || "$15 - $75"}</span>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Based on local market averages. May vary by operator.</p>
                </div>

                {/* In Your Itineraries */}
                {itineraries.filter(i => i.experiences.some(e => e.id === experience.id)).length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3">In your itineraries</h3>
                    <div className="space-y-2">
                      {itineraries
                        .filter(i => i.experiences.some(e => e.id === experience.id))
                        .map(itinerary => (
                          <Link 
                            key={itinerary.id} 
                            to={`/my-trips/${itinerary.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{itinerary.name}</p>
                              <p className="text-xs text-muted-foreground">{itinerary.experiences.length} experiences</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Live Planning */}
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[hsl(var(--success))] rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        <span className="text-primary">{likedByCount > 0 ? likedByCount : 'Be the first'}</span> {likedByCount > 0 ? 'people interested' : 'to save this'}
                      </p>
                      <p className="text-xs text-muted-foreground">Add to your itinerary</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}