import { useParams, useNavigate } from "react-router-dom";
import { usePoiBySlug, usePoiProducts, usePoiExperiences } from "@/hooks/usePoiBySlug";
import { useDestinationBySlug } from "@/hooks/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, MapPin, Navigation2, Share2, ChevronRight, Plus, Heart, Star, Clock } from "lucide-react";
import { generateExperienceUrl } from "@/utils/slugUtils";
import { cn } from "@/lib/utils";
import { ShareDrawer } from "@/components/ShareDrawer";
import { useState } from "react";

const typeConfig: Record<string, { label: string; gradient: string }> = {
  beach: { label: "Beach", gradient: "from-sky-500/90 to-cyan-400/90" },
  attraction: { label: "Attraction", gradient: "from-amber-500/90 to-orange-400/90" },
  landmark: { label: "Landmark", gradient: "from-rose-500/90 to-pink-400/90" },
  nature: { label: "Nature", gradient: "from-emerald-500/90 to-green-400/90" },
  marine: { label: "Marine Life", gradient: "from-blue-500/90 to-indigo-400/90" },
  island: { label: "Island", gradient: "from-teal-500/90 to-cyan-400/90" },
  viewpoint: { label: "Viewpoint", gradient: "from-violet-500/90 to-purple-400/90" },
  market: { label: "Market", gradient: "from-orange-500/90 to-amber-400/90" },
  forest: { label: "Forest", gradient: "from-green-600/90 to-emerald-500/90" },
  cave: { label: "Cave", gradient: "from-stone-600/90 to-stone-500/90" },
};

export default function PoiDetail() {
  const { destination: destParam, slug } = useParams<{ destination: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: poi, isLoading: poiLoading } = usePoiBySlug(slug || "");
  const { data: destination } = useDestinationBySlug(destParam || "");
  const { data: linkedProducts = [] } = usePoiProducts(poi?.id || "");
  const { data: linkedExperiences = [] } = usePoiExperiences(poi?.id || "", poi?.destination_id || null);

  const typeInfo = typeConfig[poi?.poi_type || ""] || { label: poi?.poi_type || "Place", gradient: "from-primary/90 to-primary/70" };

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/things-to-do");
  };

  const mapsUrl = poi?.latitude && poi?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`
    : poi?.google_place_id
      ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${poi.google_place_id}`
      : null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/things-to-do/${destParam}/${slug}`
    : "";

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
  const allActivities = [
    ...linkedProducts.map((p: any) => ({ ...p, type: "product" as const })),
    ...linkedExperiences.map((e: any) => ({
      id: e.id,
      title: e.title,
      cover_image: e.video_thumbnail,
      slug: e.slug,
      location: e.location,
      price: e.price,
      duration: e.duration,
      type: "experience" as const,
    })),
  ];

  const content = (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${poi.name} — ${destination?.name || "Things to Do"}`}
        description={poi.description || `Discover ${poi.name}, a must-visit ${typeInfo.label.toLowerCase()} in ${destination?.name || "East Africa"}`}
        canonicalPath={canonicalPath}
        indexability={poi.is_public_page ? "public_indexed" : "public_noindex"}
      />

      {/* ─── Immersive Hero ─── */}
      <div className="relative">
        <div className="aspect-[3/4] max-h-[70vh] w-full overflow-hidden">
          {poi.cover_image ? (
            <img
              src={poi.cover_image}
              alt={poi.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br", typeInfo.gradient)} />
          )}
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        </div>

        {/* Floating header controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <button
            onClick={handleGoBack}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-white" />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Share2 className="w-[18px] h-[18px] text-white" />
          </button>
        </div>

        {/* Hero content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10">
          {/* Type pill */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3 backdrop-blur-xl",
            "bg-white/15 text-white border border-white/20"
          )}>
            <MapPin className="w-3 h-3" />
            {typeInfo.label}
          </div>

          <h1 className="text-[28px] font-extrabold text-white leading-[1.1] tracking-tight">
            {poi.name}
          </h1>

          {destination && (
            <p className="text-[15px] text-white/70 font-medium mt-1.5">
              {destination.name}
            </p>
          )}

          {/* Directions CTA — primary action */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-white text-black font-semibold text-[15px] active:scale-[0.97] transition-transform shadow-lg"
            >
              <Navigation2 className="w-[18px] h-[18px]" />
              Open in Maps
            </a>
          )}
        </div>
      </div>

      {/* ─── Content body ─── */}
      <div className="px-4 pt-5 pb-10 space-y-7">

        {/* Description */}
        {poi.description && (
          <div>
            <p className="text-[15px] text-foreground/80 leading-relaxed">
              {poi.description}
            </p>
          </div>
        )}

        {/* Location info row */}
        {(poi.latitude || poi.google_place_id) && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{poi.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{destination?.name || destParam}</p>
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform"
              >
                Directions
              </a>
            )}
          </div>
        )}

        {/* ─── Activities at this place ─── */}
        {allActivities.length > 0 && (
          <div>
            <h2 className="text-[17px] font-bold text-foreground mb-4">
              Things to do at {poi.name}
            </h2>
            <div className="space-y-3">
              {allActivities.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() =>
                    item.type === "product"
                      ? navigate(`/things-to-do/${destParam}/${item.slug}`)
                      : navigate(generateExperienceUrl(item.location || "", item.title, item.slug))
                  }
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform text-left group"
                >
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-muted shrink-0">
                    {item.cover_image || item.video_thumbnail ? (
                      <img
                        src={item.cover_image || item.video_thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      {item.price && (
                        <span className="text-xs text-muted-foreground">{item.price}</span>
                      )}
                      {item.duration && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-active:text-foreground shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allActivities.length === 0 && (
          <div className="text-center py-10 px-6">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">No activities yet</p>
            <p className="text-sm text-muted-foreground">
              Experiences at {poi.name} coming soon
            </p>
          </div>
        )}
      </div>

      <ShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={poi.name}
        url={shareUrl}
      />
    </div>
  );

  if (isMobile) {
    return <MobileShell hideAvatar>{content}</MobileShell>;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-6">
        {content}
      </div>
    </MainLayout>
  );
}
