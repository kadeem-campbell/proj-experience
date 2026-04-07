import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDestinationBySlug, useAreas, useProducts } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateDestinationSchema } from "@/services/schemaGenerator";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { ArrowLeft, MapPin, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export default function DestinationPage() {
  const { destination: destSlug = "", area: areaSlug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trackPageView } = useInteractions();

  const { data: destination, isLoading } = useDestinationBySlug(destSlug);
  const { data: areas = [] } = useAreas(destination?.id);
  const selectedArea = useMemo(() => areas.find((area) => area.slug === areaSlug), [areas, areaSlug]);
  const { data: products = [] } = useProducts(
    destination
      ? { destinationId: destination.id, ...(selectedArea ? { areaId: selectedArea.id } : {}) }
      : undefined,
  );

  useEffect(() => {
    if (destination?.id) {
      trackPageView(selectedArea ? "area" : "destination", selectedArea?.id || destination.id, window.location.pathname);
    }
  }, [destination?.id, selectedArea?.id]);

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
      {/* Hero */}
      <div className="relative">
        {heroImage ? (
          <div className="aspect-[16/9] max-h-[280px] overflow-hidden">
            <img src={heroImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="flex items-center gap-3">
          {destination?.flag_svg_url && (
            <img src={destination.flag_svg_url} alt={destination.name} className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-background" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {selectedArea && destination && (
              <button onClick={() => navigate(`/${destSlug}`)} className="text-xs text-muted-foreground font-medium">
                ← {destination.name}
              </button>
            )}
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Areas grid — only on destination level */}
      {!selectedArea && areas.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-3">Places</h2>
          <div className="grid grid-cols-2 gap-3">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => navigate(`/${destSlug}/${area.slug}`)}
                className="relative aspect-[3/2] rounded-xl overflow-hidden bg-muted"
              >
                {area.cover_image ? (
                  <img src={area.cover_image} alt={area.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2.5 left-3">
                  <h3 className="text-white font-semibold text-sm drop-shadow-sm">{area.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="px-4 mt-8 pb-8">
        {products.length > 0 && (
          <h2 className="text-xs font-bold uppercase tracking-[1.5px] text-muted-foreground/60 mb-3">
            {products.length} thing{products.length !== 1 ? "s" : ""} to do
          </h2>
        )}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                title={item.title}
                creator=""
                views=""
                videoThumbnail={item.cover_image_url || ""}
                category=""
                location={locationLabel || destination?.name || ""}
                price={item.average_price_per_person ? `$${item.average_price_per_person}` : ""}
                slug={item.slug}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No experiences found yet.</p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead title={`${title} — Things to Do`} description={description} canonicalPath={canonicalPath} indexability="public_indexed" image={heroImage} jsonLd={jsonLd || undefined} />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout>
      <SEOHead title={`${title} — Things to Do`} description={description} canonicalPath={canonicalPath} indexability="public_indexed" image={heroImage} jsonLd={jsonLd || undefined} />
      <div className="max-w-6xl mx-auto">{content}</div>
    </MainLayout>
  );
}
