import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, ChevronLeft, Check, Compass, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useDestinations, useProducts, useAreas } from "@/hooks/useProducts";
import { useExperiencesData } from "@/hooks/useExperiencesData";
import { useInteractions } from "@/hooks/useInteractions";
import { cn } from "@/lib/utils";

export default function Map() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackPageView, trackMapInteraction } = useInteractions();

  const { data: destinations = [] } = useDestinations();
  const { data: products = [] } = useProducts();
  const legacyExperiences = useExperiencesData();

  const [selectedDest, setSelectedDest] = useState<string>("");

  useEffect(() => {
    trackPageView('map', 'hub', 'direct');
  }, []);

  // Build map items from products + legacy experiences with coordinates
  const mapItems = useMemo(() => {
    const items: { id: string; title: string; lat: number; lng: number; type: string; slug: string; destination?: string }[] = [];

    products.forEach(p => {
      if (p.latitude && p.longitude) {
        const dest = destinations.find(d => d.id === p.destination_id);
        items.push({ id: p.id, title: p.title, lat: Number(p.latitude), lng: Number(p.longitude), type: 'product', slug: p.slug, destination: dest?.name });
      }
    });

    // Destinations as markers
    destinations.forEach(d => {
      if (d.latitude && d.longitude) {
        items.push({ id: d.id, title: d.name, lat: Number(d.latitude), lng: Number(d.longitude), type: 'destination', slug: d.slug });
      }
    });

    return items;
  }, [products, destinations]);

  const filteredItems = selectedDest
    ? mapItems.filter(i => i.destination === selectedDest || i.title === selectedDest)
    : mapItems;

  const content = (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-3 w-full px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Explore Map</h1>
        <span className="text-xs text-muted-foreground ml-auto">{filteredItems.length} places</span>
      </div>

      {/* Destination filter pills */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedDest("")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              !selectedDest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            All
          </button>
          {destinations.map(d => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDest(selectedDest === d.name ? "" : d.name);
                trackMapInteraction('filter_destination', [d.id]);
              }}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                selectedDest === d.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map placeholder + entity list */}
      <div className="relative">
        {/* Map area */}
        <div className="h-[40vh] bg-muted/30 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
          <div className="text-center z-10">
            <Compass className="w-12 h-12 text-primary/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">{filteredItems.length} places mapped</p>
            <p className="text-xs text-muted-foreground/60">Mapbox integration ready</p>
          </div>
          {/* Dot markers */}
          {filteredItems.slice(0, 20).map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "absolute w-3 h-3 rounded-full border-2 border-background shadow-sm cursor-pointer",
                item.type === 'destination' ? "bg-primary w-4 h-4" : "bg-accent"
              )}
              style={{
                left: `${15 + ((i * 37) % 70)}%`,
                top: `${10 + ((i * 23) % 75)}%`,
              }}
              title={item.title}
              onClick={() => {
                if (item.type === 'destination') navigate(`/${item.slug}`);
                else navigate(`/things-to-do/explore/${item.slug}`);
              }}
            />
          ))}
        </div>

        {/* Entity list below map */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {selectedDest || 'All'} — {filteredItems.length} places
          </h2>
          <div className="space-y-2">
            {filteredItems.slice(0, 30).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'destination') navigate(`/${item.slug}`);
                  else navigate(`/things-to-do/explore/${item.slug}`);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:scale-[0.98] transition-transform text-left"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  item.type === 'destination' ? "bg-primary/10" : "bg-accent/10"
                )}>
                  <MapPin className={cn("w-4 h-4", item.type === 'destination' ? "text-primary" : "text-accent-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                  {item.destination && <p className="text-xs text-muted-foreground">{item.destination}</p>}
                  <p className="text-[10px] text-muted-foreground/60">{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <Compass className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No places with coordinates yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead title="Explore Map" description="Explore activities and things to do on the map" url="https://swam.app/explore/map" />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout showItineraryPanel={false}>
      <SEOHead title="Explore Map" description="Explore activities and things to do on the map" url="https://swam.app/explore/map" />
      <div className="max-w-4xl mx-auto">{content}</div>
    </MainLayout>
  );
}
