import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHosts, useActivityTypes, useDestinations, Host } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Search, X, CheckCircle2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Count products per host
const useHostProductCounts = () => {
  return useQuery({
    queryKey: ["host-product-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_hosts")
        .select("host_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.host_id] = (counts[r.host_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fallback: count experiences per creator name for hosts with legacy links
const useHostExperienceCounts = () => {
  return useQuery({
    queryKey: ["host-experience-counts-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("experiences")
        .select("creator, location")
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      const locations: Record<string, Set<string>> = {};
      (data || []).forEach((e: any) => {
        const name = (e.creator || "").trim().toLowerCase();
        if (name) {
          counts[name] = (counts[name] || 0) + 1;
          if (e.location) {
            if (!locations[name]) locations[name] = new Set();
            locations[name].add(e.location);
          }
        }
      });
      return { counts, locations };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export default function Hosts() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: hosts = [], isLoading } = useHosts();
  const { data: activityTypes = [] } = useActivityTypes();
  const { data: destinations = [] } = useDestinations();
  const { data: productCounts = {} } = useHostProductCounts();
  const { data: expData } = useHostExperienceCounts();
  const expCounts = expData?.counts || {};
  const expLocations = expData?.locations || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    Object.values(expLocations).forEach(s => s.forEach(l => locs.add(l)));
    return Array.from(locs).sort();
  }, [expLocations]);

  const filteredHosts = useMemo(() => {
    let result = hosts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.username?.toLowerCase().includes(q) ||
        h.display_name?.toLowerCase().includes(q) ||
        h.bio?.toLowerCase().includes(q)
      );
    }
    if (selectedDestination) {
      result = result.filter(h => {
        if (h.destination_id === selectedDestination) return true;
        // Fallback: check experience locations
        const name = (h.username || h.display_name || "").toLowerCase();
        const dest = destinations.find(d => d.id === selectedDestination);
        if (!dest) return false;
        const locs = expLocations[name];
        return locs && Array.from(locs).some(l => l.toLowerCase().includes(dest.name.toLowerCase()));
      });
    }
    return result;
  }, [hosts, searchQuery, selectedDestination, destinations, expLocations]);

  const getExpCount = (host: Host) => {
    const pc = productCounts[host.id] || 0;
    if (pc > 0) return pc;
    const name = (host.username || host.display_name || "").toLowerCase();
    return expCounts[name] || 0;
  };

  const getHostLocation = (host: Host) => {
    if (host.destination_id) {
      const dest = destinations.find(d => d.id === host.destination_id);
      if (dest) return dest.name;
    }
    const name = (host.username || host.display_name || "").toLowerCase();
    const locs = expLocations[name];
    if (!locs || locs.size === 0) return "";
    return Array.from(locs)[0];
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Experience Hosts",
    description: "Discover local experience hosts and activity providers across East Africa",
    url: "https://swam.app/hosts",
    numberOfItems: filteredHosts.length,
    itemListElement: filteredHosts.slice(0, 20).map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: h.display_name || h.username,
        url: `https://swam.app/hosts/${h.slug}`,
        ...(h.avatar_url ? { image: h.avatar_url } : {}),
      },
    })),
  };

  const content = (
    <div className="bg-background min-h-screen">
      <SEOHead
        title="Experience Hosts — Local Guides & Activity Providers"
        description="Discover verified local experience hosts and activity providers across East Africa. Book directly with trusted guides."
        canonicalPath="/hosts"
        indexability="public_indexed"
        jsonLd={jsonLd}
      />

      <div className="px-4 pt-3 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Hosts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Discover local experience hosts</p>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center bg-muted rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hosts..."
            className="flex-1 bg-transparent border-0 outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: "16px" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-1 rounded-full shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border appearance-none bg-muted",
            selectedDestination ? "bg-primary/10 text-primary border-primary/20" : "border-border text-muted-foreground"
          )}
          style={{ fontSize: '13px' }}
        >
          <option value="">All destinations</option>
          {destinations.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {activityTypes.slice(0, 6).map(at => (
          <button
            key={at.id}
            onClick={() => setSelectedActivity(selectedActivity === at.id ? "" : at.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              selectedActivity === at.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {at.emoji} {at.name}
          </button>
        ))}
      </div>

      {/* Host grid */}
      <div className="px-4 pt-2 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredHosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No hosts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredHosts.map(host => {
              const count = getExpCount(host);
              const location = getHostLocation(host);
              return (
                <button
                  key={host.id}
                  onClick={() => navigate(`/hosts/${host.slug || host.username}`)}
                  className="text-left active:scale-[0.97] transition-transform duration-150"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                    {host.avatar_url ? (
                      <img src={host.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary/30">
                          {(host.display_name || host.username).slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {host.is_verified && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-primary drop-shadow-md" />
                      </div>
                    )}
                    {count > 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm">
                        <span className="text-[10px] font-semibold text-foreground">{count} exp</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {host.display_name || host.username}
                    </h3>
                    {location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground truncate">{location}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) return <MobileShell>{content}</MobileShell>;
  return <MainLayout>{content}</MainLayout>;
}
