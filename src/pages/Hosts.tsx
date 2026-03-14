import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, X, Star, MapPin, CheckCircle2 } from "lucide-react";
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
        .select("creator")
        .eq("is_active", true);
      const counts: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        const name = (e.creator || "").trim().toLowerCase();
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    },
  });
};

export default function Hosts() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: hosts = [], isLoading } = useAllHosts();
  const { data: expCounts = {} } = useHostExperienceCounts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHosts = useMemo(() => {
    if (!searchQuery.trim()) return hosts;
    const q = searchQuery.toLowerCase();
    return hosts.filter(
      (h: any) =>
        h.username?.toLowerCase().includes(q) ||
        h.display_name?.toLowerCase().includes(q) ||
        h.bio?.toLowerCase().includes(q)
    );
  }, [hosts, searchQuery]);

  const getExpCount = (host: any) => {
    const name = (host.username || host.display_name || "").toLowerCase();
    return expCounts[name] || 0;
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

      {/* Host list */}
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
          <div className="space-y-2">
            {filteredHosts.map((host: any) => {
              const socialLinks = (host.social_links && typeof host.social_links === "object") ? host.social_links as Record<string, string> : {};
              const hasContact = Object.values(socialLinks).some((v: any) => v && String(v).trim());
              const count = getExpCount(host);

              return (
                <button
                  key={host.id}
                  onClick={() => navigate(`/hosts/${host.username}`)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                >
                  <Avatar className="w-14 h-14 shrink-0">
                    {host.avatar_url && <AvatarImage src={host.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {(host.display_name || host.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {host.display_name || host.username}
                      </h3>
                      {host.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{host.username}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {count > 0 && (
                        <span className="text-[11px] text-muted-foreground">{count} experience{count !== 1 ? "s" : ""}</span>
                      )}
                      {hasContact && (
                        <span className="text-[11px] text-primary font-medium">Contact available</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
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
