import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDestinations, useDestinationBySlug, useAreas, useActivityTypes, useProducts } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateDestinationSchema, generateWebsiteSchema } from "@/services/schemaGenerator";
import { generateExperienceUrl } from "@/utils/slugUtils";
import { ArrowLeft, MapPin, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import ExperienceDetail from "./ExperienceDetail";

export default function ThingsToDo() {
  const { destination: destSlug, area: areaSlug, activityType: activitySlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trackPageView } = useInteractions();

  // Treat "all" activityType as no filter
  const effectiveActivitySlug = activitySlug === "all" ? undefined : activitySlug;

  const { data: destinations = [], isLoading: destsLoading } = useDestinations();
  const { data: currentDestination, isLoading: destLoading } = useDestinationBySlug(destSlug || "");
  const { data: areas = [] } = useAreas(currentDestination?.id);
  const currentArea = useMemo(() => areas.find((area) => area.slug === areaSlug), [areas, areaSlug]);
  const { data: activityTypes = [] } = useActivityTypes();
  const currentActivity = useMemo(() => activityTypes.find((activity) => activity.slug === effectiveActivitySlug), [activityTypes, effectiveActivitySlug]);
  const { data: products = [] } = useProducts(
    currentDestination
      ? {
          destinationId: currentDestination.id,
          ...(currentArea ? { areaId: currentArea.id } : {}),
          ...(currentActivity ? { activityTypeId: currentActivity.id } : {}),
        }
      : undefined,
  );

  useEffect(() => {
    if (currentDestination || !destSlug) {
      trackPageView("things_to_do", currentActivity?.id || currentArea?.id || currentDestination?.id || "hub", window.location.pathname);
    }
  }, [currentDestination?.id, currentArea?.id, currentActivity?.id]);

  // If destSlug doesn't match any destination and loading is done, render as experience detail
  const isExperienceSlug = destSlug && !destLoading && !destsLoading && !currentDestination;

  const displayItems = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        title: product.title,
        videoThumbnail: product.cover_image,
        location: [currentArea?.name, currentDestination?.name].filter(Boolean).join(", ") || currentDestination?.name || "",
        slug: product.slug,
      })),
    [products, currentArea?.name, currentDestination?.name],
  );

  if (isExperienceSlug) {
    return <ExperienceDetail />;
  }

  const pageTitle = currentActivity
    ? `${currentActivity.name} in ${currentArea?.name || currentDestination?.name}`
    : currentArea
      ? `Things to Do in ${currentArea.name}`
      : currentDestination
        ? `Things to Do in ${currentDestination.name}`
        : "Things to Do";

  const pageDescription = currentDestination?.description || "Discover the best things to do across SWAM destinations.";
  const jsonLd = currentDestination ? generateDestinationSchema(currentDestination, products) : generateWebsiteSchema();

  // Show loading while destination is resolving
  if (destSlug && (destLoading || destsLoading)) {
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

  const content = (
    <div className="bg-background min-h-screen">
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{pageTitle}</h1>
            {currentDestination && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{[currentArea?.name, currentDestination.name].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{displayItems.length} things to do</p>
      </div>

      {!destSlug && destinations.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Destinations</h2>
          <div className="flex gap-2 flex-wrap">
            {destinations.map((destination) => (
              <button
                key={destination.id}
                onClick={() => navigate(`/things-to-do/${destination.slug}`)}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground active:scale-95 transition-transform"
              >
                {destination.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentDestination && areas.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Areas</h2>
          <div className="flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => navigate(`/things-to-do/${currentDestination.slug}/${area.slug}/all`)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-transform active:scale-95",
                  currentArea?.id === area.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground",
                )}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentArea && activityTypes.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {activityTypes.map((activity) => (
              <button
                key={activity.id}
                onClick={() => navigate(`/things-to-do/${currentDestination?.slug}/${currentArea.slug}/${activity.slug}`)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  currentActivity?.id === activity.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {activity.emoji} {activity.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(generateExperienceUrl(item.location, item.title, item.slug, currentDestination?.slug))}
              className="cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                {item.videoThumbnail ? (
                  <img src={item.videoThumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{item.title}</h3>
                {item.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead title={pageTitle} description={pageDescription} canonicalPath={window.location.pathname} indexability="public_indexed" jsonLd={jsonLd} />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <SEOHead title={pageTitle} description={pageDescription} canonicalPath={window.location.pathname} indexability="public_indexed" jsonLd={jsonLd} />
      <div className="max-w-6xl mx-auto px-6 py-8">{content}</div>
    </MainLayout>
  );
}
