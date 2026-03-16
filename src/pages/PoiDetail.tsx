import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePoiBySlug, usePoiMedia, usePoiProducts, usePoiExperiences } from "@/hooks/usePoiBySlug";
import { useDestinationBySlug } from "@/hooks/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ShareDrawer } from "@/components/ShareDrawer";
import { SocialVideoEmbed } from "@/components/SocialVideoEmbed";
import {
  ArrowLeft, MapPin, Share2, ChevronRight, Clock,
  Heart, Star, Navigation2, Sparkles, Plus,
} from "lucide-react";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";

const typeConfig: Record<string, { label: string }> = {
  beach: { label: "Beach" },
  attraction: { label: "Attraction" },
  landmark: { label: "Landmark" },
  nature: { label: "Nature" },
  marine: { label: "Marine Life" },
  island: { label: "Island" },
  viewpoint: { label: "Viewpoint" },
  market: { label: "Market" },
  forest: { label: "Forest" },
  cave: { label: "Cave" },
};

export default function PoiDetail() {
  const { destination: destParam, slug } = useParams<{ destination: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const [localLiked, setLocalLiked] = useState(false);

  const { data: poi, isLoading: poiLoading } = usePoiBySlug(slug || "");
  const { data: destination } = useDestinationBySlug(destParam || "");
  const { data: mediaAssets = [] } = usePoiMedia(poi?.id || "");
  const { data: linkedProducts = [] } = usePoiProducts(poi?.id || "");
  const { data: linkedExperiences = [] } = usePoiExperiences(poi?.id || "", poi?.destination_id || null);

  const typeInfo = typeConfig[poi?.poi_type || ""] || { label: poi?.poi_type || "Place" };

  const liked = poi ? (isAuthenticated ? isDbLiked(poi.id, "experience") : localLiked) : false;

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/things-to-do");
  };

  const handleLikeClick = async () => {
    if (!poi) return;
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(poi.id, "experience", { id: poi.id, title: poi.name, videoThumbnail: poi.cover_image || "" });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  const directionsUrl = poi?.latitude && poi?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`
    : poi?.google_place_id
      ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${poi.google_place_id}`
      : null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/things-to-do/${destParam}/${slug}`
    : "";

  // Build gallery from media_assets + cover_image
  const gallery = useMemo(() => {
    const images: string[] = [];
    if (poi?.cover_image) images.push(poi.cover_image);
    mediaAssets.forEach((m: any) => {
      if (m.media_type === "image" && m.url && !images.includes(m.url)) {
        images.push(m.url);
      }
    });
    return images;
  }, [poi?.cover_image, mediaAssets]);

  // Social video assets from media
  const tiktokVideos = useMemo(() => {
    return mediaAssets
      .filter((m: any) => m.media_type === "tiktok" || m.media_type === "video")
      .map((m: any) => ({ videoId: m.id, url: m.url, author: m.caption || "" }));
  }, [mediaAssets]);

  const instagramEmbed = useMemo(() => {
    const ig = mediaAssets.find((m: any) => m.media_type === "instagram");
    return ig?.url || "";
  }, [mediaAssets]);

  const hasSocialContent = tiktokVideos.length > 0 || !!instagramEmbed;

  // All linked activities
  const allActivities = useMemo(() => [
    ...linkedProducts.map((p: any) => ({ ...p, itemType: "product" as const })),
    ...linkedExperiences.map((e: any) => ({
      id: e.id, title: e.title, cover_image: e.video_thumbnail,
      slug: e.slug, location: e.location, price: e.price,
      duration: e.duration, category: e.category,
      itemType: "experience" as const,
    })),
  ], [linkedProducts, linkedExperiences]);

  if (poiLoading) {
    const Wrapper = isMobile ? MobileShell : MainLayout;
    return (
      <Wrapper {...(isMobile ? { hideAvatar: true } : {})}>
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Wrapper>
    );
  }

  if (!poi) return null;

  const canonicalPath = `/things-to-do/${destParam}/${slug}`;

  // ─── MOBILE ───
  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead
          title={`${poi.name} — ${destination?.name || "Things to Do"}`}
          description={poi.description || `Discover ${poi.name} in ${destination?.name || "East Africa"}`}
          canonicalPath={canonicalPath}
          indexability={poi.is_public_page ? "public_indexed" : "public_noindex"}
          image={poi.cover_image || undefined}
        />

        <div className="bg-background overflow-y-auto">
          {/* Photo Gallery / Hero */}
          <div className="relative">
            {gallery.length > 1 ? (
              <PhotoGallery images={gallery} title={poi.name} />
            ) : (
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {gallery[0] ? (
                  <img src={gallery[0]} alt={poi.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>
            )}
            {/* Floating controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button
                onClick={handleGoBack}
                className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <ShareDrawer title={poi.name} url={shareUrl}>
                  <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <Share2 className="w-5 h-5 text-foreground" />
                  </button>
                </ShareDrawer>
                <button
                  onClick={handleLikeClick}
                  className={cn(
                    "w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform",
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
            {/* Title + Location */}
            <h1 className="text-2xl font-bold tracking-tight mb-1">{poi.name}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{destination?.name || destParam}</span>
            </div>

            {/* Type + info row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{typeInfo.label}</span>
              </div>
            </div>

            {/* Directions CTA */}
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform shadow-sm"
              >
                <Navigation2 className="w-5 h-5" />
                Get Directions
              </a>
            )}

            {/* Social Video Embeds */}
            {hasSocialContent && (
              <SocialVideoEmbed
                experienceTitle={poi.name}
                location={destination?.name || destParam || ""}
                tiktokVideos={tiktokVideos}
                instagramEmbed={instagramEmbed}
                className="mb-6"
              />
            )}

            {/* About */}
            {poi.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{poi.description}</p>
              </div>
            )}

            {/* Things to do here */}
            {allActivities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Things to do here</h2>
                <div className="space-y-2.5">
                  {allActivities.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.itemType === "product"
                          ? navigate(`/things-to-do/${destParam}/${item.slug}`)
                          : navigate(generateProductPageUrl(item.location || "", item.title, item.slug))
                      }
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform text-left group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                        {item.cover_image || item.video_thumbnail ? (
                          <img src={item.cover_image || item.video_thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {item.price && <span className="text-xs text-muted-foreground">{item.price}</span>}
                          {item.duration && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /> {item.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-active:text-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {allActivities.length === 0 && (
              <div className="mb-6 text-center py-8 px-4 rounded-2xl bg-card border border-border">
                <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-0.5">No activities yet</p>
                <p className="text-xs text-muted-foreground">Experiences at {poi.name} coming soon</p>
              </div>
            )}

            <div className="h-8" />
          </div>
        </div>
      </MobileShell>
    );
  }

  // ─── DESKTOP ───
  return (
    <MainLayout>
      <SEOHead
        title={`${poi.name} — ${destination?.name || "Things to Do"}`}
        description={poi.description || `Discover ${poi.name} in ${destination?.name || "East Africa"}`}
        canonicalPath={canonicalPath}
        indexability={poi.is_public_page ? "public_indexed" : "public_noindex"}
        image={poi.cover_image || undefined}
      />
      <div className="max-w-4xl mx-auto py-6 px-6">
        {/* Gallery */}
        <div className="relative mb-6">
          {gallery.length > 1 ? (
            <div className="aspect-[3/1] overflow-hidden rounded-2xl">
              <PhotoGallery images={gallery} title={poi.name} />
            </div>
          ) : (
            <div className="aspect-[3/1] overflow-hidden rounded-2xl bg-muted">
              {gallery[0] ? (
                <img src={gallery[0]} alt={poi.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{poi.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="w-4 h-4" />
              <span>{destination?.name || destParam}</span>
              <span className="text-border">·</span>
              <span>{typeInfo.label}</span>
            </div>

            {poi.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{poi.description}</p>
              </div>
            )}

            {hasSocialContent && (
              <SocialVideoEmbed
                experienceTitle={poi.name}
                location={destination?.name || destParam || ""}
                tiktokVideos={tiktokVideos}
                instagramEmbed={instagramEmbed}
                className="mb-8"
              />
            )}

            {allActivities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Things to do here</h2>
                <div className="space-y-3">
                  {allActivities.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.itemType === "product"
                          ? navigate(`/things-to-do/${destParam}/${item.slug}`)
                          : navigate(generateProductPageUrl(item.location || "", item.title, item.slug))
                      }
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                        {item.cover_image || item.video_thumbnail ? (
                          <img src={item.cover_image || item.video_thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {item.price && <span className="text-sm text-muted-foreground">{item.price}</span>}
                          {item.duration && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" /> {item.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0">
            <div className="sticky top-24 space-y-4">
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Navigation2 className="w-5 h-5" />
                  Get Directions
                </a>
              )}
              <ShareDrawer title={poi.name} url={shareUrl}>
                <button className="w-full h-12 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors text-foreground">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </ShareDrawer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
