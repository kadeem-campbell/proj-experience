import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePoiBySlug, usePoiProducts, usePoiExperiences } from "@/hooks/usePoiBySlug";
import { useDestinationBySlug } from "@/hooks/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Navigation, ExternalLink, Compass, ChevronRight } from "lucide-react";
import { generateExperienceUrl } from "@/utils/slugUtils";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
  beach: { label: "Beach", emoji: "🏖️", color: "bg-sky-100 text-sky-800" },
  attraction: { label: "Attraction", emoji: "🏛️", color: "bg-amber-100 text-amber-800" },
  landmark: { label: "Landmark", emoji: "📍", color: "bg-rose-100 text-rose-800" },
  nature: { label: "Nature", emoji: "🌿", color: "bg-emerald-100 text-emerald-800" },
  marine: { label: "Marine", emoji: "🐠", color: "bg-blue-100 text-blue-800" },
  island: { label: "Island", emoji: "🏝️", color: "bg-teal-100 text-teal-800" },
  viewpoint: { label: "Viewpoint", emoji: "👁️", color: "bg-purple-100 text-purple-800" },
  market: { label: "Market", emoji: "🛍️", color: "bg-orange-100 text-orange-800" },
  forest: { label: "Forest", emoji: "🌳", color: "bg-green-100 text-green-800" },
  cave: { label: "Cave", emoji: "🕳️", color: "bg-stone-100 text-stone-800" },
};

export default function PoiDetail() {
  const { destination: destParam, slug } = useParams<{ destination: string; slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: poi, isLoading: poiLoading } = usePoiBySlug(slug || "");
  const { data: destination } = useDestinationBySlug(destParam || "");
  const { data: linkedProducts = [] } = usePoiProducts(poi?.id || "");
  const { data: linkedExperiences = [] } = usePoiExperiences(poi?.id || "", poi?.destination_id || null);

  const typeInfo = typeLabels[poi?.poi_type || ""] || { label: poi?.poi_type || "Place", emoji: "📍", color: "bg-muted text-muted-foreground" };

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/things-to-do");
  };

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

  if (!poi) return null; // Will be handled by ExperienceDetail's 404

  const canonicalPath = `/things-to-do/${destParam}/${slug}`;

  const content = (
    <>
      <SEOHead
        title={`${poi.name} — ${destination?.name || "Things to Do"}`}
        description={poi.description || `Discover ${poi.name}, a must-visit ${typeInfo.label.toLowerCase()} in ${destination?.name || "East Africa"}`}
        canonicalPath={canonicalPath}
        indexability={poi.is_public_page ? "public_indexed" : "public_noindex"}
      />

      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          {poi.cover_image ? (
            <img src={poi.cover_image} alt={poi.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center">
              <span className="text-6xl">{typeInfo.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={handleGoBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center active:scale-95 transition-transform z-10"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        {/* Hero overlay text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <Badge className={cn("mb-2 text-[10px] font-semibold uppercase tracking-wider", typeInfo.color)}>
            {typeInfo.emoji} {typeInfo.label}
          </Badge>
          <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight">{poi.name}</h1>
          {destination && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/70" />
              <span className="text-sm text-white/80 font-medium">{destination.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 pb-8 space-y-6">
        {/* Description */}
        {poi.description && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">{poi.description}</p>
          </div>
        )}

        {/* Quick info cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {poi.latitude && poi.longitude && (
            <a
              href={`https://www.google.com/maps?q=${poi.latitude},${poi.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border active:scale-[0.97] transition-transform"
            >
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Get directions</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
          {poi.google_place_id && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${poi.google_place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border active:scale-[0.97] transition-transform"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">View on Google Maps</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>

        {/* Connected experiences */}
        {(linkedProducts.length > 0 || linkedExperiences.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Things to do here</h2>
              <Compass className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {linkedProducts.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/things-to-do/${destParam}/${product.slug}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:scale-[0.98] transition-transform text-left"
                >
                  {product.cover_image ? (
                    <img src={product.cover_image} alt={product.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{product.title}</h3>
                    {product.duration && <p className="text-xs text-muted-foreground mt-0.5">{product.duration}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
              {linkedExperiences.map((exp: any) => (
                <button
                  key={exp.id}
                  onClick={() => navigate(generateExperienceUrl(exp.location || "", exp.title, exp.slug))}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:scale-[0.98] transition-transform text-left"
                >
                  {exp.video_thumbnail ? (
                    <img src={exp.video_thumbnail} alt={exp.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{exp.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{exp.location}</p>
                    {exp.price && <p className="text-xs text-muted-foreground">{exp.price}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for connected experiences */}
        {linkedProducts.length === 0 && linkedExperiences.length === 0 && (
          <div className="text-center py-8 px-4 rounded-xl bg-muted/30 border border-border/50">
            <Compass className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activities linked to this place yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back soon for experiences at {poi.name}</p>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return <MobileShell hideAvatar>{content}</MobileShell>;
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-6">
        {content}
      </div>
    </MainLayout>
  );
}
