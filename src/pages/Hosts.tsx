import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCategories } from "@/hooks/useAppData";
import { Search, X, CheckCircle2, MapPin, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const useAllHosts = () => {
  return useQuery({
    queryKey: ["all-hosts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creators")
        .select("*")
        .eq("is_active", true)
        .order("display_name", { ascending: true });
      return data || [];
    },
  });
};

const useHostExperienceCounts = () => {
  return useQuery({
    queryKey: ["host-experience-counts"],
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
  });
};

const useAllCreatorCategories = () => {
  return useQuery({
    queryKey: ["all-creator-categories"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("creator_categories")
        .select("creator_id, category_id");
      const map: Record<string, string[]> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.creator_id]) map[r.creator_id] = [];
        map[r.creator_id].push(r.category_id);
      });
      return map;
    },
  });
};

export default function Hosts() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: hosts = [], isLoading } = useAllHosts();
  const { data: expData } = useHostExperienceCounts();
  const { data: categories = [] } = useCategories();
  const { data: creatorCats = {} } = useAllCreatorCategories();
  const expCounts = expData?.counts || {};
  const expLocations = expData?.locations || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // Get all unique locations from host experiences
  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    Object.values(expLocations).forEach(s => s.forEach(l => locs.add(l)));
    return Array.from(locs).sort();
  }, [expLocations]);

  const filteredHosts = useMemo(() => {
    let result = hosts;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h: any) =>
          h.username?.toLowerCase().includes(q) ||
          h.display_name?.toLowerCase().includes(q) ||
          h.bio?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((h: any) => {
        const cats = creatorCats[h.id] || [];
        return cats.includes(selectedCategory);
      });
    }

    if (selectedLocation) {
      result = result.filter((h: any) => {
        const name = (h.username || h.display_name || "").toLowerCase();
        const locs = expLocations[name];
        return locs && locs.has(selectedLocation);
      });
    }

    return result;
  }, [hosts, searchQuery, selectedCategory, selectedLocation, creatorCats, expLocations]);

  const getExpCount = (host: any) => {
    const name = (host.username || host.display_name || "").toLowerCase();
    return expCounts[name] || 0;
  };

  const getHostLocation = (host: any) => {
    const name = (host.username || host.display_name || "").toLowerCase();
    const locs = expLocations[name];
    if (!locs || locs.size === 0) return "";
    return Array.from(locs)[0];
  };

  const getHostCategoryNames = (hostId: string) => {
    const catIds = creatorCats[hostId] || [];
    return catIds
      .map((cid: string) => categories.find((c: any) => c.id === cid))
      .filter(Boolean)
      .map((c: any) => c.name);
  };

  const content = (
    <div className="bg-background min-h-screen">
      {/* Header */}
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
        {/* Location filter */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border appearance-none bg-muted",
            selectedLocation ? "bg-primary/10 text-primary border-primary/20" : "border-border text-muted-foreground"
          )}
          style={{ fontSize: '13px' }}
        >
          <option value="">All locations</option>
          {allLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Category filter chips */}
        {categories.slice(0, 6).map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Host grid - Spotify square cards */}
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
            {filteredHosts.map((host: any) => {
              const count = getExpCount(host);
              const location = getHostLocation(host);
              const catNames = getHostCategoryNames(host.id);

              return (
                <button
                  key={host.id}
                  onClick={() => navigate(`/hosts/${host.username}`)}
                  className="text-left active:scale-[0.97] transition-transform duration-150"
                >
                  {/* Square avatar card */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                    {host.avatar_url ? (
                      <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
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
                  {/* Info */}
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
                    {catNames.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {catNames.join(' · ')}
                      </p>
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

  if (isMobile) {
    return <MobileShell>{content}</MobileShell>;
  }

  return <MainLayout>{content}</MainLayout>;
}
