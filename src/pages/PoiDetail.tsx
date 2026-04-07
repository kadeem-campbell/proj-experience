import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePoiBySlug, usePoiMedia, usePoiProducts } from "@/hooks/usePoiBySlug";
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
  Heart, Navigation2, Sparkles, Plus, Search, X, ListPlus, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CreateItineraryDrawer } from "@/components/CreateItineraryDrawer";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
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

// Opening hours display
const OpeningHoursSection = ({ hours }: { hours: Record<string, string> }) => {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
  };
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const uniqueHours = [...new Set(days.map(d => hours[d]).filter(Boolean))];
  const isUniform = uniqueHours.length === 1;

  return (
    <div className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-4">Opening times</h2>
      {isUniform ? (
        <div className="p-4 rounded-2xl bg-card border border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Open daily</p>
              <p className="text-xs text-muted-foreground mt-0.5">{uniqueHours[0]}</p>
            </div>
          </div>
          {hours.note && <p className="text-xs text-muted-foreground/70 mt-3 italic">{hours.note}</p>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {days.map(day => (
            <div key={day} className={cn("flex items-center justify-between px-4 py-2.5 rounded-xl text-sm", day === today ? "bg-primary/5 font-semibold" : "")}>
              <span className={cn("text-muted-foreground", day === today && "text-primary")}>{dayLabels[day]}</span>
              <span className={cn("font-medium", day === today ? "text-primary" : "text-foreground")}>{hours[day] || "Closed"}</span>
            </div>
          ))}
          {hours.note && <p className="text-xs text-muted-foreground/70 mt-2 italic px-4">{hours.note}</p>}
        </div>
      )}
    </div>
  );
};

export default function PoiDetail() {
  const { destination: destParam, slug } = useParams<{ destination: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { itineraries, addExperienceToItinerary, createItinerary } = useItineraries();
  const [localLiked, setLocalLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddToItinerarySheet, setShowAddToItinerarySheet] = useState(false);
  const [addItinerarySearch, setAddItinerarySearch] = useState("");
  const [showCreateItineraryDrawer, setShowCreateItineraryDrawer] = useState(false);
  const [goToAction, setGoToAction] = useState<{ name: string; id: string } | null>(null);

  const { data: poi, isLoading: poiLoading } = usePoiBySlug(slug || "");
  const { data: destination } = useDestinationBySlug(destParam || "");
  const { data: mediaAssets = [] } = usePoiMedia(poi?.id || "");
  const { data: linkedProducts = [] } = usePoiProducts(poi?.id || "");

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

  const handleOpenItinerarySheet = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setShowAddToItinerarySheet(true);
  };

  const filteredItineraries = itineraries.filter(i =>
    !addItinerarySearch.trim() || i.name.toLowerCase().includes(addItinerarySearch.toLowerCase())
  );

  const handleAddToExistingItinerary = (targetItinerary: Itinerary) => {
    if (!poi) return;
    addExperienceToItinerary(targetItinerary.id, {
      id: poi.id, title: poi.name, creator: "",
      videoThumbnail: poi.cover_image || "", category: typeInfo.label,
      location: destination?.name || destParam || "", price: "",
    });
    setShowAddToItinerarySheet(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    setGoToAction({ name: targetItinerary.name, id: targetItinerary.id });
    setTimeout(() => setGoToAction(null), 8000);
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/things-to-do/${destParam}/${slug}`
    : "";

  const gallery = useMemo(() => {
    const images: string[] = [];
    if (poi?.cover_image) images.push(poi.cover_image);
    mediaAssets.forEach((m: any) => {
      if (m.media_type === "image" && m.url && !images.includes(m.url)) images.push(m.url);
    });
    return images;
  }, [poi?.cover_image, mediaAssets]);

  const tiktokVideos = useMemo(() => {
    return mediaAssets
      .filter((m: any) => m.media_type === "tiktok" || m.media_type === "video")
      .map((m: any) => ({ videoId: m.id, url: m.url, author: m.caption || "" }));
  }, [mediaAssets]);

  const hasSocialContent = tiktokVideos.length > 0;
  const openingHours = (poi as any)?.opening_hours_json as Record<string, string> | null;
  const hasOpeningHours = openingHours && Object.keys(openingHours).length > 0;

  const allActivities = useMemo(() =>
    linkedProducts.map((p: any) => ({ ...p, itemType: "product" as const })),
  [linkedProducts]);

  if (poiLoading) {
    return isMobile ? (
      <MobileShell hideTopBar>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    ) : (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!poi) return null;

  const canonicalPath = `/things-to-do/${destParam}/${slug}`;

  // ── Add to Itinerary Drawer (shared) ──
  const itineraryDrawer = (
    <>
      {/* Go-to action banner */}
      {goToAction && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary/5 border border-primary/10 rounded-xl p-3 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => { navigate(`/itineraries/${goToAction.id}`); setGoToAction(null); }}
            className="flex items-center gap-2 text-sm text-primary font-medium w-full"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Go to {goToAction.name}
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>
      )}

      <Drawer open={showAddToItinerarySheet} onOpenChange={setShowAddToItinerarySheet}>
        <DrawerContent className="max-h-[60vh] overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle>Add to itinerary</DrawerTitle>
            <DrawerDescription>Save this place to your collection</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <button
              onClick={() => {
                setShowAddToItinerarySheet(false);
                setTimeout(() => setShowCreateItineraryDrawer(true), 300);
              }}
              className="w-full flex items-center gap-3 p-4 border-b border-border/30 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-sm text-primary">New itinerary</span>
            </button>
            <div className="px-4 py-2">
              <div className="flex items-center bg-muted rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <Input
                  type="text"
                  value={addItinerarySearch}
                  onChange={(e) => setAddItinerarySearch(e.target.value)}
                  placeholder="Search your itineraries..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                  style={{ fontSize: '16px' }}
                />
                {addItinerarySearch && (
                  <button onClick={() => setAddItinerarySearch("")} className="p-1 rounded-full shrink-0">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="px-2">
              {filteredItineraries.length > 0 ? (
                filteredItineraries.map(itin => {
                  const coverImg = itin.coverImage || itin.experiences?.[0]?.videoThumbnail;
                  return (
                    <button
                      key={itin.id}
                      onClick={() => handleAddToExistingItinerary(itin)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {coverImg ? (
                          <img src={coverImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <ListPlus className="w-4 h-4 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{itin.name}</p>
                        <p className="text-xs text-muted-foreground">{itin.experiences.length} experiences</p>
                      </div>
                      <span className="text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10">Add</span>
                    </button>
                  );
                })
              ) : addItinerarySearch.trim() ? (
                <div className="py-6 px-4 text-center">
                  <p className="text-sm text-muted-foreground">No itineraries match "<span className="font-medium text-foreground">{addItinerarySearch}</span>"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No itineraries yet. Create one above!</p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <CreateItineraryDrawer open={showCreateItineraryDrawer} onOpenChange={setShowCreateItineraryDrawer} />
    </>
  );

  // ─── Shared content sections ───
  const renderContentSections = () => (
    <>
      {/* Add to Itinerary CTA */}
      <div className="mb-5">
        <Button size="lg" onClick={handleOpenItinerarySheet} className={cn("w-full h-[54px] rounded-2xl font-bold text-[15px] bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/10 tracking-[-0.01em]", justAdded && "animate-pulse")}>
          <span className="flex items-center gap-2.5"><Plus className="w-5 h-5" />Add to Itinerary</span>
        </Button>
      </div>

      {/* Type pill */}
      <div className="flex items-center gap-2 mb-7">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50 text-[13px]">
          <MapPin className="w-4 h-4 text-primary/60" />
          <span className="font-medium text-foreground/80">{typeInfo.label}</span>
        </div>
      </div>

      {/* About */}
      {poi.description && (
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-3">About</h2>
          <p className="text-[15px] text-foreground/75 leading-[1.75]">{poi.description}</p>
        </div>
      )}

      {/* Long Description */}
      {(poi as any).long_description && (
        <div className="mb-8">
          <p className="text-[15px] text-foreground/75 leading-[1.75]">{(poi as any).long_description}</p>
        </div>
      )}

      {/* Opening Times */}
      {hasOpeningHours && <OpeningHoursSection hours={openingHours!} />}

      {/* Social Video */}
      {hasSocialContent && (
        <div className="mb-8 -mx-4">
          <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-4 px-4">See it in action</h2>
          <SocialVideoEmbed
            experienceTitle={poi.name}
            location={destination?.name || destParam || ""}
            tiktokVideos={tiktokVideos}
            className="px-4"
          />
        </div>
      )}

      {/* Activities at this place */}
      {allActivities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-4">Things to do here</h2>
          <div className="space-y-2.5">
            {allActivities.map((item: any) => (
              <button
                key={item.id}
                onClick={() => navigate(`/things-to-do/${destParam}/${item.slug}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40 active:scale-[0.98] transition-transform text-left group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {item.average_price_per_person && <span className="text-xs text-muted-foreground">${item.average_price_per_person} avg</span>}
                    {item.duration_minutes && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {item.duration_minutes} min
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
        <div className="mb-6 text-center py-8 px-4 rounded-2xl bg-card border border-border/40">
          <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-0.5">No activities yet</p>
          <p className="text-xs text-muted-foreground">Experiences at {poi.name} coming soon</p>
        </div>
      )}
    </>
  );

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
          {/* Hero */}
          <div className="relative">
            {gallery.length > 1 ? (
              <PhotoGallery images={gallery} title={poi.name} />
            ) : (
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                {gallery[0] ? (
                  <img src={gallery[0]} alt={poi.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </div>
            )}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-2xl flex items-center justify-center border border-white/10">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <ShareDrawer title={poi.name} url={shareUrl}>
                  <button className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-2xl flex items-center justify-center border border-white/10">
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                </ShareDrawer>
                <button onClick={handleLikeClick} className={cn("w-10 h-10 rounded-full backdrop-blur-2xl flex items-center justify-center border border-white/10", liked ? "bg-primary/70" : "bg-black/25")}>
                  <Heart className={cn("w-5 h-5", liked ? "fill-white text-white" : "text-white")} />
                </button>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10">
              <div className="pt-40 pb-6 px-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 65%, transparent 100%)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3 h-3 text-white/50" />
                  <span className="text-[12px] text-white/70 font-medium tracking-wide uppercase">{destination?.name || destParam}</span>
                </div>
                <h1 className="text-[26px] font-extrabold text-white leading-[1.1] mb-3" style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif', letterSpacing: '-0.5px' }}>
                  {poi.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] text-white/90 font-medium" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <MapPin className="w-3 h-3" />
                    {typeInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-6 pb-4">
            {renderContentSections()}
            <div className="h-8" />
          </div>
        </div>
        {itineraryDrawer}
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
      <div className="max-w-6xl mx-auto py-6 px-6">
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
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <ShareDrawer title={poi.name} url={shareUrl}>
                <button className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Share2 className="w-5 h-5 text-foreground" />
                </button>
              </ShareDrawer>
              <button onClick={handleLikeClick} className={cn("w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg", liked && "bg-primary/15")}>
                <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
          <div>
            <div className="mb-5">
              <h1 className="text-3xl font-bold tracking-tight mb-2">{poi.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{destination?.name || destParam}</span>
                <span className="text-border">·</span>
                <span>{typeInfo.label}</span>
              </div>
            </div>

            {poi.description && (
              <div className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-3">About</h2>
                <p className="text-[15px] text-foreground/75 leading-[1.75]">{poi.description}</p>
              </div>
            )}

            {(poi as any).long_description && (
              <div className="mb-8">
                <p className="text-[15px] text-foreground/75 leading-[1.75]">{(poi as any).long_description}</p>
              </div>
            )}

            {hasOpeningHours && <OpeningHoursSection hours={openingHours!} />}

            {hasSocialContent && (
              <div className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-4">See it in action</h2>
                <SocialVideoEmbed
                  experienceTitle={poi.name}
                  location={destination?.name || destParam || ""}
                  tiktokVideos={tiktokVideos}
                />
              </div>
            )}

            {allActivities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-4">Things to do here</h2>
                <div className="space-y-3">
                  {allActivities.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/things-to-do/${destParam}/${item.slug}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                        {item.cover_image_url ? (
                          <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {item.average_price_per_person && <span className="text-sm text-muted-foreground">${item.average_price_per_person} avg</span>}
                          {item.duration_minutes && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" /> {item.duration_minutes} min
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
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Button size="lg" onClick={handleOpenItinerarySheet} className={cn("w-full h-13 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90", justAdded && "animate-pulse")}>
                  <span className="flex items-center gap-2"><Plus className="w-5 h-5" />Add to Itinerary</span>
                </Button>
                <button onClick={handleLikeClick} className={cn("w-full mt-3 h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all", liked ? "bg-primary/5 border-primary/20 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground")}>
                  <Heart className={cn("w-4 h-4", liked && "fill-primary")} />{liked ? "Liked" : "Like"}
                </button>
              </div>
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
      {itineraryDrawer}
    </MainLayout>
  );
}
