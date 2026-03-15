/**
 * Things To Do Hub Page
 * Route: /things-to-do and /things-to-do/{destination}
 * 
 * Discovery hub showing products organized by destination, area, and activity type.
 * Falls back to the existing experiences data while products table is being populated.
 */
import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { ExperienceCard } from "@/components/ExperienceCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useExperiencesData } from "@/hooks/useExperiencesData";
import { useDestinations, useDestinationBySlug, useAreas, useActivityTypes, useProducts } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateDestinationSchema, generateWebsiteSchema } from "@/services/schemaGenerator";
import { ArrowLeft, MapPin, Compass, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThingsToDo() {
  const { destination: destSlug, area: areaSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedActivity, setSelectedActivity] = useState<string>("");

  // New entity system
  const { data: destinations = [] } = useDestinations();
  const { data: currentDestination } = useDestinationBySlug(destSlug || "");
  const { data: areas = [] } = useAreas(currentDestination?.id);
  const { data: activityTypes = [] } = useActivityTypes();
  const { data: products = [] } = useProducts(
    currentDestination ? { destinationId: currentDestination.id } : undefined
  );

  // Fallback to legacy experiences
  const legacyExperiences = useExperiencesData();

  // Use products if available, otherwise fall back to experiences
  const hasProducts = products.length > 0;
  const displayItems = useMemo(() => {
    if (hasProducts) {
      return products.map(p => ({
        id: p.id,
        title: p.title,
        creator: "",
        views: String(p.view_count || 0),
        videoThumbnail: p.cover_image,
        category: "",
        location: currentDestination?.name || "",
        price: "",
        slug: p.slug,
      }));
    }
    // Filter legacy experiences by destination name if we have a destination slug
    if (destSlug) {
      return legacyExperiences.filter(e =>
        e.location?.toLowerCase().includes(destSlug.toLowerCase())
      );
    }
    return legacyExperiences;
  }, [hasProducts, products, legacyExperiences, destSlug, currentDestination]);

  const pageTitle = currentDestination
    ? `Things to Do in ${currentDestination.name}`
    : "Things to Do in East Africa";
  const pageDescription = currentDestination?.description ||
    "Discover the best experiences, activities and things to do across East Africa. Curated by locals.";

  const jsonLd = currentDestination
    ? generateDestinationSchema(currentDestination, products)
    : generateWebsiteSchema();

  const content = (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{pageTitle}</h1>
            {currentDestination && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{currentDestination.name}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{displayItems.length} things to do</p>
      </div>

      {/* Destination pills (when no destination selected) */}
      {!destSlug && destinations.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Destinations</h2>
          <div className="flex gap-2 flex-wrap">
            {destinations.map(dest => (
              <button
                key={dest.id}
                onClick={() => navigate(`/things-to-do/${dest.slug}`)}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground active:scale-95 transition-transform"
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Areas (when destination selected) */}
      {currentDestination && areas.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Areas</h2>
          <div className="flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => navigate(`/${currentDestination.slug}/${area.slug}`)}
                className="shrink-0 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground active:scale-95 transition-transform"
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity type filter */}
      {activityTypes.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {activityTypes.map(at => (
              <button
                key={at.id}
                onClick={() => setSelectedActivity(selectedActivity === at.id ? "" : at.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  selectedActivity === at.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {at.emoji} {at.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items grid */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {displayItems.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/experiences/${item.slug || item.id}`)}
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

        {displayItems.length === 0 && (
          <div className="text-center py-16">
            <Compass className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No things to do found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead
          title={pageTitle}
          description={pageDescription}
          url={`https://swam.app/things-to-do${destSlug ? '/' + destSlug : ''}`}
          jsonLd={jsonLd}
        />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        url={`https://swam.app/things-to-do${destSlug ? '/' + destSlug : ''}`}
        jsonLd={jsonLd}
      />
      <div className="max-w-6xl mx-auto px-6 py-8">{content}</div>
    </MainLayout>
  );
}
