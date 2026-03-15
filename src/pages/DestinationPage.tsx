import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDestinationBySlug, useAreas, useProducts, useActivityTypes } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateDestinationSchema } from "@/services/schemaGenerator";
import { generateExperienceUrl } from "@/utils/slugUtils";
import { ArrowLeft, MapPin, Compass, ChevronRight, Map } from "lucide-react";

export default function DestinationPage() {
  const { destination: destSlug = "", area: areaSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trackPageView } = useInteractions();

  const { data: destination, isLoading } = useDestinationBySlug(destSlug);
  const { data: areas = [] } = useAreas(destination?.id);
  const selectedArea = useMemo(() => areas.find((area) => area.slug === areaSlug), [areas, areaSlug]);
  const { data: activityTypes = [] } = useActivityTypes();
  const { data: products = [] } = useProducts(
    destination
      ? { destinationId: destination.id, ...(selectedArea ? { areaId: selectedArea.id } : {}) }
      : undefined,
  );

  useEffect(() => {
    if (destination?.id) {
      trackPageView(selectedArea ? "area" : "destination", selectedArea?.id || destination.id, window.location.pathname);
    }
  }, [destination?.id, selectedArea?.id, window.location.pathname]);

  if (isLoading) {
    return isMobile ? (
      <MobileShell hideTopBar>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    ) : (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const title = selectedArea?.name || destination?.name || "Destination";
  const description = selectedArea?.description || destination?.description || `Discover the best things to do in ${title}`;
  const heroImage = selectedArea?.cover_image || destination?.cover_image;
  const locationLabel = destination ? [selectedArea?.name, destination.name].filter(Boolean).join(", ") : "";
  const jsonLd = destination ? generateDestinationSchema(destination, products) : null;
  const canonicalPath = selectedArea ? `/${destSlug}/${selectedArea.slug}` : `/${destSlug}`;

  const content = (
    <div className="bg-background min-h-screen">
      <div className="relative">
        {heroImage ? (
          <div className="aspect-[16/9] max-h-[200px] overflow-hidden">
            <img src={heroImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-center gap-3">
          {destination?.flag_svg_url && (
            <img src={destination.flag_svg_url} alt={destination.name} className="w-10 h-10 rounded-full object-cover shadow-md" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {destination?.airport_code && (
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">{destination.airport_code}</span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate(`/things-to-do/${destSlug}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
          >
            <Compass className="w-4 h-4" />
            Things to do
          </button>
          <button
            onClick={() => navigate(`/${destSlug}/map`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted text-foreground text-sm font-semibold active:scale-95 transition-transform"
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {/* Areas grid - only show on destination level (not area level) */}
      {!selectedArea && areas.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-lg font-bold mb-3">Explore by area</h2>
          <div className="grid grid-cols-2 gap-3">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => navigate(`/${destSlug}/${area.slug}`)}
                className="relative aspect-[3/2] rounded-xl overflow-hidden bg-muted active:scale-[0.97] transition-transform"
              >
                {area.cover_image ? (
                  <img src={area.cover_image} alt={area.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <h3 className="text-white font-semibold text-sm">{area.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity type filters - show on area level */}
      {activityTypes.length > 0 && selectedArea && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold mb-3">Activities</h2>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {activityTypes.map((activityType) => (
              <button
                key={activityType.id}
                onClick={() => navigate(`/things-to-do/${destSlug}/${selectedArea.slug}/${activityType.slug}`)}
                className="shrink-0 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground active:scale-95 transition-transform"
              >
                {activityType.emoji} {activityType.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="px-4 mt-8 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Top things to do</h2>
          <button onClick={() => navigate(`/things-to-do/${destSlug}`)} className="flex items-center gap-1 text-sm text-primary font-medium">
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(generateExperienceUrl(locationLabel || destination?.name || "", item.title, item.slug, destination?.slug))}
                className="cursor-pointer active:scale-[0.97] transition-transform"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <img src={item.cover_image || ""} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{locationLabel || destination?.name || ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No experiences found yet for this location.</p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead title={`${title} — Things to Do & Experiences`} description={description} url={`https://swam.app${canonicalPath}`} image={heroImage} jsonLd={jsonLd || undefined} />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <SEOHead title={`${title} — Things to Do & Experiences`} description={description} url={`https://swam.app${canonicalPath}`} image={heroImage} jsonLd={jsonLd || undefined} />
      <div className="max-w-6xl mx-auto">{content}</div>
    </MainLayout>
  );
}