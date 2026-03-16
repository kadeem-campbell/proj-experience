import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, ChevronLeft, Compass, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useDestinations, useProducts, useAreas, useDestinationBySlug } from "@/hooks/useProducts";
import { useInteractions } from "@/hooks/useInteractions";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { cn } from "@/lib/utils";

const rasterStyle: mapboxgl.Style = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export default function Map() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { destination: routeDestinationSlug } = useParams();
  const { trackPageView, trackMapInteraction } = useInteractions();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const { data: destinations = [] } = useDestinations();
  const { data: routeDestination } = useDestinationBySlug(routeDestinationSlug || "");
  const { data: areas = [] } = useAreas(routeDestination?.id);
  const { data: products = [] } = useProducts(routeDestination ? { destinationId: routeDestination.id } : undefined);

  const [selectedDest, setSelectedDest] = useState(routeDestination?.name || "");

  useEffect(() => {
    if (routeDestination?.name) setSelectedDest(routeDestination.name);
  }, [routeDestination?.name]);

  useEffect(() => {
    trackPageView("map", routeDestination?.id || "hub", window.location.pathname);
  }, [routeDestination?.id, window.location.pathname]);

  const mapItems = useMemo(() => {
    const allAreas = routeDestination ? areas : [];
    return products
      .map((product) => {
        const destination = destinations.find((item) => item.id === product.destination_id) || routeDestination;
        const area = allAreas.find((item) => item.id === product.area_id);
        const lat = Number(product.latitude ?? area?.latitude ?? destination?.latitude ?? 0);
        const lng = Number(product.longitude ?? area?.longitude ?? destination?.longitude ?? 0);
        if (!lat || !lng || !destination) return null;
        return {
          id: product.id,
          title: product.title,
          lat,
          lng,
          type: "product" as const,
          slug: product.slug,
          destinationSlug: destination.slug,
          destinationName: destination.name,
          locationLabel: [area?.name, destination.name].filter(Boolean).join(", "),
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        title: string;
        lat: number;
        lng: number;
        type: "product";
        slug: string;
        destinationSlug: string;
        destinationName: string;
        locationLabel: string;
      }>;
  }, [products, destinations, areas, routeDestination]);

  const destinationMarkers = useMemo(
    () =>
      destinations
        .filter((destination) => destination.latitude && destination.longitude)
        .map((destination) => ({
          id: destination.id,
          title: destination.name,
          lat: Number(destination.latitude),
          lng: Number(destination.longitude),
          type: "destination" as const,
          slug: destination.slug,
        })),
    [destinations],
  );

  const filteredItems = useMemo(() => {
    if (!selectedDest) return [...destinationMarkers, ...mapItems];
    return [
      ...destinationMarkers.filter((item) => item.title === selectedDest),
      ...mapItems.filter((item) => item.destinationName === selectedDest),
    ];
  }, [selectedDest, destinationMarkers, mapItems]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: rasterStyle,
      center: [39.2083, -6.1659],
      zoom: 5,
      attributionControl: true,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    filteredItems.forEach((item) => {
      const el = document.createElement("button");
      el.className = cn(
        "rounded-full border-2 border-background shadow-md",
        item.type === "destination" ? "h-4 w-4 bg-primary" : "h-3 w-3 bg-accent",
      );

      el.onclick = () => {
        if (item.type === "destination") {
          navigate(`/${item.slug}`);
          return;
        }
        navigate(generateProductPageUrl(item.destinationName, item.title, item.slug, item.destinationSlug));
      };

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([item.lng, item.lat]).addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    if (filteredItems.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredItems.forEach((item) => bounds.extend([item.lng, item.lat]));
      mapRef.current.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 400 });
    }
  }, [filteredItems, navigate]);

  const content = (
    <div className="bg-background min-h-screen">
      <div className="flex items-center gap-3 w-full px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Explore Map</h1>
        <span className="text-xs text-muted-foreground ml-auto">{filteredItems.length} places</span>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setSelectedDest("")}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", !selectedDest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
          >
            All
          </button>
          {destinations.map((destination) => (
            <button
              key={destination.id}
              onClick={() => {
                setSelectedDest(selectedDest === destination.name ? "" : destination.name);
                trackMapInteraction("filter_destination", [destination.id]);
              }}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                selectedDest === destination.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {destination.name}
            </button>
          ))}
        </div>
      </div>

      <div ref={mapContainerRef} className="h-[40vh] w-full" />

      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {selectedDest || "All"} — {filteredItems.length} places
        </h2>
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.type === "destination") {
                  navigate(`/${item.slug}`);
                  return;
                }
                navigate(generateProductPageUrl(item.destinationName, item.title, item.slug, item.destinationSlug));
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:scale-[0.98] transition-transform text-left"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.type === "destination" ? "bg-primary/10" : "bg-accent/10")}>
                <MapPin className={cn("w-4 h-4", item.type === "destination" ? "text-primary" : "text-accent-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                {"locationLabel" in item && item.locationLabel && <p className="text-xs text-muted-foreground">{item.locationLabel}</p>}
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Compass className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No mapped places found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <SEOHead title="Explore Map" description="Explore activities and things to do on the map" canonicalPath={window.location.pathname} indexability="public_indexed" />
        {content}
      </MobileShell>
    );
  }

  return (
    <MainLayout showItineraryPanel={false}>
      <SEOHead title="Explore Map" description="Explore activities and things to do on the map" canonicalPath={window.location.pathname} indexability="public_indexed" />
      <div className="max-w-4xl mx-auto">{content}</div>
    </MainLayout>
  );
}
