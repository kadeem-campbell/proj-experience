import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Star, MapPin, ExternalLink, MessageCircle, Globe, Instagram, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils/slugUtils";
import { useCategories } from "@/hooks/useAppData";

const useCreatorByUsername = (username: string) => {
  return useQuery({
    queryKey: ["creator", username],
    queryFn: async () => {
      // First try exact username match
      const { data: exact } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();
      if (exact) return exact;

      // Fallback: fetch all active creators and match by slugified display_name or username
      const { data: all } = await supabase
        .from("creators")
        .select("*")
        .eq("is_active", true);
      if (!all) return null;
      const slug = username.toLowerCase();
      return all.find(c =>
        c.username === slug ||
        c.username?.toLowerCase().replace(/\s+/g, '-') === slug ||
        (c.display_name || '').toLowerCase().replace(/\s+/g, '-') === slug
      ) || null;
    },
    enabled: !!username,
  });
};

const useCreatorCategories = (creatorId: string) => {
  return useQuery({
    queryKey: ["creator-categories", creatorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_categories")
        .select("category_id")
        .eq("creator_id", creatorId);
      return (data || []).map((r: any) => r.category_id);
    },
    enabled: !!creatorId,
  });
};

const useCreatorExperiences = (creatorName: string) => {
  return useQuery({
    queryKey: ["creator-experiences", creatorName],
    queryFn: async () => {
      const { data } = await supabase
        .from("experiences")
        .select("id, title, slug, video_thumbnail, category, location, price, rating")
        .eq("is_active", true)
        .ilike("creator", `%${creatorName}%`);
      return data || [];
    },
    enabled: !!creatorName,
  });
};

const useCreatorItineraries = (creatorId: string) => {
  return useQuery({
    queryKey: ["creator-itineraries", creatorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("public_itineraries")
        .select("id, name, slug, cover_image, like_count")
        .eq("creator_id", creatorId)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!creatorId,
  });
};

export default function HostProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: creator, isLoading } = useCreatorByUsername(username || "");
  const { data: experiences = [] } = useCreatorExperiences(creator?.username || creator?.display_name || "");
  const { data: itineraries = [] } = useCreatorItineraries(creator?.id || "");
  const { data: categoryIds = [] } = useCreatorCategories(creator?.id || "");
  const { data: allCategories = [] } = useCategories();
  const creatorCategories = allCategories.filter(c => categoryIds.includes(c.id));

  const socialLinks = (creator?.social_links && typeof creator.social_links === "object") ? creator.social_links as Record<string, string> : {};

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

  if (!creator) {
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
      {/* Header */}
      <div className="relative px-4 pt-4 pb-6">
        <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-20 h-20">
            {creator.avatar_url && <AvatarImage src={creator.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {(creator.display_name || creator.username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{creator.display_name || creator.username}</h1>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {creator.is_verified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
              <span className="text-xs text-muted-foreground">{experiences.length} experiences</span>
              <span className="text-xs text-muted-foreground">{itineraries.length} itineraries</span>
            </div>
            {creatorCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {creatorCategories.map(cat => (
                  <Badge key={cat.id} variant="outline" className="text-[10px] font-medium">
                    {cat.emoji} {cat.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {creator.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{creator.bio}</p>
        )}

        {/* Contact Links */}
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

      {/* Experiences */}
      {experiences.length > 0 && (
        <div className="px-4 pb-6">
          <h2 className="text-lg font-semibold mb-3">Experiences</h2>
          <div className="space-y-2">
            {experiences.map((exp: any) => (
              <div
                key={exp.id}
                onClick={() => navigate(`/experiences/${exp.slug || slugify(exp.title)}`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  {exp.video_thumbnail ? (
                    <img src={exp.video_thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{exp.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{exp.location} · {exp.category}</p>
                </div>
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium text-xs">{exp.rating || 4.7}</span>
                </div>
              </div>
            ))}
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
                    <img src={it.cover_image} alt={it.name} className="w-full h-full object-cover" />
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

  if (isMobile) {
    return <MobileShell hideTopBar>{content}</MobileShell>;
  }

  return <div className="min-h-screen bg-background max-w-4xl mx-auto">{content}</div>;
}
