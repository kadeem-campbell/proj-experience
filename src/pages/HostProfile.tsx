import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { SEOHead } from "@/components/SEOHead";
import { generateHostSchema } from "@/services/schemaGenerator";
import { ArrowLeft, Star, MapPin, ExternalLink, MessageCircle, Globe, Instagram, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { useActivityTypes, useDestinations } from "@/hooks/useProducts";
import type { Host } from "@/hooks/useProducts";

// Lookup host from hosts table only
const useHostByUsername = (username: string) => {
  return useQuery({
    queryKey: ["host-profile", username],
    queryFn: async () => {
      const { data: host } = await supabase
        .from("hosts")
        .select("*")
        .eq("is_active", true)
        .or(`slug.eq.${username},username.eq.${username}`)
        .maybeSingle();
      if (host) return { ...host, _source: "hosts" as const };
      return null;
    },
    enabled: !!username,
  });
};

const useHostCategories = (hostId: string) => {
  return useQuery({
    queryKey: ["host-categories", hostId],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_categories")
        .select("category_id")
        .eq("creator_id", hostId);
      return (data || []).map((r: any) => r.category_id);
    },
    enabled: !!hostId,
  });
};

// Fetch products linked to a host via product_hosts join
const useHostProducts = (hostId: string) => {
  return useQuery({
    queryKey: ["host-products", hostId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_hosts")
        .select("product_id, products(id, title, slug, cover_image, duration, rating, destination_id)")
        .eq("host_id", hostId);
      return (data || []).map((r: any) => r.products).filter(Boolean);
    },
    enabled: !!hostId,
  });
};

const useHostItineraries = (hostId: string) => {
  return useQuery({
    queryKey: ["host-itineraries", hostId],
    queryFn: async () => {
      const { data } = await supabase
        .from("public_itineraries")
        .select("id, name, slug, cover_image, like_count")
        .eq("creator_id", hostId)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!hostId,
  });
};

export default function HostProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: host, isLoading } = useHostByUsername(username || "");
  const hostId = host?.id || "";
  const { data: products = [] } = useHostProducts(hostId);
  const { data: itineraries = [] } = useHostItineraries(hostId);
  const { data: categoryIds = [] } = useHostCategories(hostId);
  const { data: allActivityTypes = [] } = useActivityTypes();
  const { data: destinations = [] } = useDestinations();
  const hostCategories = allActivityTypes.filter(c => categoryIds.includes(c.id));

  const socialLinks = (host?.social_links && typeof host.social_links === "object") ? host.social_links as Record<string, string> : {};

  const contactItems = [
    { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", href: socialLinks.whatsapp ? `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}` : null },
    { key: "website", icon: Globe, label: "Website", href: socialLinks.website || null },
    { key: "instagram", icon: Instagram, label: "Instagram", href: socialLinks.instagram ? `https://instagram.com/${socialLinks.instagram.replace('@', '')}` : null },
    { key: "tiktok", icon: ExternalLink, label: "TikTok", href: socialLinks.tiktok ? `https://tiktok.com/@${socialLinks.tiktok.replace('@', '')}` : null },
    { key: "email", icon: Mail, label: "Email", href: socialLinks.email ? `mailto:${socialLinks.email}` : null },
    { key: "phone", icon: Phone, label: "Phone", href: socialLinks.phone ? `tel:${socialLinks.phone}` : null },
  ].filter(item => item.href);

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };

  const getDestName = (destId: string | null) => {
    if (!destId) return "";
    return destinations.find(d => d.id === destId)?.name || "";
  };

  const hostForSchema = host ? {
    id: host.id,
    username: host.username,
    display_name: host.display_name || '',
    slug: (host as any).slug || host.username,
    bio: host.bio || '',
    avatar_url: host.avatar_url || '',
    social_links: socialLinks,
    destination_id: null,
    area_id: null,
    is_verified: host.is_verified || false,
    is_active: true,
    legacy_creator_id: null,
  } as Host : null;

  if (isLoading) {
    const Wrapper = isMobile ? MobileShell : ({ children }: { children: React.ReactNode }) => <div className="min-h-screen bg-background">{children}</div>;
    return (
      <Wrapper {...(isMobile ? { hideTopBar: true } : {})}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Wrapper>
    );
  }

  if (!host) {
    const Wrapper = isMobile ? MobileShell : ({ children }: { children: React.ReactNode }) => <div className="min-h-screen bg-background">{children}</div>;
    return (
      <Wrapper {...(isMobile ? { hideTopBar: true } : {})}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-3">Host not found</h1>
            <Button size="sm" onClick={() => navigate('/')}>Back to Discover</Button>
          </div>
        </div>
      </Wrapper>
    );
  }

  const content = (
    <div className="bg-background overflow-y-auto">
      {hostForSchema && (
        <SEOHead
          title={`${host.display_name || host.username} — Experience Host`}
          description={host.bio || `Discover experiences hosted by ${host.display_name || host.username}`}
          canonicalPath={`/hosts/${(host as any).slug || host.username}`}
          indexability="public_indexed"
          image={host.avatar_url || undefined}
          jsonLd={generateHostSchema(hostForSchema)}
        />
      )}

      {/* Header */}
      <div className="relative px-4 pt-4 pb-6">
        <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-20 h-20">
            {host.avatar_url && <AvatarImage src={host.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {(host.display_name || host.username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{host.display_name || host.username}</h1>
            <p className="text-sm text-muted-foreground">@{host.username}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {host.is_verified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
              <span className="text-xs text-muted-foreground">{products.length} experiences</span>
              <span className="text-xs text-muted-foreground">{itineraries.length} itineraries</span>
            </div>
            {hostCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hostCategories.map(cat => (
                  <Badge key={cat.id} variant="outline" className="text-[10px] font-medium">
                    {cat.emoji} {cat.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {host.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{host.bio}</p>
        )}

        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {contactItems.map(item => (
              <a
                key={item.key}
                href={item.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Products (Things to do) */}
      {products.length > 0 && (
        <div className="px-4 pb-6">
          <h2 className="text-lg font-semibold mb-3">Things to Do</h2>
          <div className="space-y-2">
            {products.map((prod: any) => {
              const destName = getDestName(prod.destination_id);
              return (
                <div
                  key={prod.id}
                  onClick={() => navigate(generateProductPageUrl(destName, prod.title, prod.slug))}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {prod.cover_image ? (
                      <img src={prod.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{prod.title}</h3>
                    {destName && <p className="text-xs text-muted-foreground truncate">{destName}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-sm shrink-0">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium text-xs">{prod.rating || 4.7}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Itineraries */}
      {itineraries.length > 0 && (
        <div className="px-4 pb-6">
          <h2 className="text-lg font-semibold mb-3">Itineraries</h2>
          <div className="grid grid-cols-2 gap-3">
            {itineraries.map((it: any) => (
              <div
                key={it.id}
                onClick={() => navigate(`/itineraries/${it.slug || it.id}`)}
                className="cursor-pointer"
              >
                <div className="relative aspect-[3/2.5] rounded-xl overflow-hidden bg-muted">
                  {it.cover_image ? (
                    <img src={it.cover_image} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{it.name}</h3>
                  <p className="text-xs text-muted-foreground">❤️ {it.like_count || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );

  if (isMobile) return <MobileShell hideTopBar>{content}</MobileShell>;
  return <div className="min-h-screen bg-background max-w-4xl mx-auto">{content}</div>;
}
