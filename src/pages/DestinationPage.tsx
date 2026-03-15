/**
 * Destination Page
 * Route: /{destination}
 * 
 * Top-level destination hub showing areas, activity types, top products,
 * collections, and map preview.
 */
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDestinationBySlug, useAreas, useProducts } from "@/hooks/useProducts";
import { useExperiencesData } from "@/hooks/useExperiencesData";
import { generateDestinationSchema } from "@/services/schemaGenerator";
import { ArrowLeft, MapPin, Compass, ChevronRight, Map } from "lucide-react";

export default function DestinationPage() {
  const { destination: destSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: destination, isLoading } = useDestinationBySlug(destSlug || "");
  const { data: areas = [] } = useAreas(destination?.id);
  const { data: products = [] } = useProducts(destination ? { destinationId: destination.id } : undefined);

  // Fallback: filter legacy experiences by destination name
  const legacyExperiences = useExperiencesData();
  const filteredLegacy = useMemo(() => {
    if (!destSlug) return [];
    return legacyExperiences.filter(e =>
      e.location?.toLowerCase().includes(destSlug.toLowerCase())
    );
  }, [legacyExperiences, destSlug]);

  const displayProducts = products.length > 0 ? products : filteredLegacy;

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

  // If no destination found, show the legacy experiences filtered by slug
  const title = destination?.name || (destSlug ? destSlug.charAt(0).toUpperCase() + destSlug.slice(1) : "Destination");
  const description = destination?.description || `Discover the best things to do in ${title}`;

  const content = (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="relative">
        {destination?.cover_image ? (
          <div className="aspect-[16/9] max-h-[200px] overflow-hidden">
            <img src={destination.cover_image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}

        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>

        {/* Quick actions */}
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

      {/* Areas */}
      {areas.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-lg font-bold mb-3">Explore by area</h2>
          <div className="grid grid-cols-2 gap-3">
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => navigate(`/${destSlug}/${area.slug}`)}
                className="relative aspect-[3/2] rounded-xl overflow-hidden bg-muted active:scale-[0.97] transition-transform"
              >
                {area.cover_image ? (
                  <img src={area.cover_image} alt={area.name} className="w-full h-full object-cover" />
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

      {/* Top products/experiences */}
      <div className="px-4 mt-8 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Top things to do</h2>
          <button
            onClick={() => navigate(`/things-to-do/${destSlug}`)}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {displayProducts.slice(0, 6).map((item: any) => (
            <div
              key={item.id}
              onClick={() => navigate(`/experiences/${item.slug || item.id}`)}
              className="cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                <img
                  src={item.cover_image || item.videoThumbnail || ""}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{item.location || destination?.name || ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const jsonLd = destination ? generateDestinationSchema(destination, products) : null;

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead
          title={`${title} — Things to Do & Experiences`}
          description={description}
          url={`https://swam.app/${destSlug}`}
          image={destination?.cover_image}
          jsonLd={jsonLd || undefined}
        />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <SEOHead
        title={`${title} — Things to Do & Experiences`}
        description={description}
        url={`https://swam.app/${destSlug}`}
        image={destination?.cover_image}
        jsonLd={jsonLd || undefined}
      />
      <div className="max-w-6xl mx-auto">{content}</div>
    </MainLayout>
  );
}
