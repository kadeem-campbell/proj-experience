import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  video_url: string;
  gallery: any[];
  highlights: any[];
  meeting_points: any[];
  duration: string;
  best_time: string;
  weather: string;
  tier: string;
  format_type: string;
  rating: number;
  like_count: number;
  view_count: number;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_indexable: boolean;
  canonical_url: string | null;
  publish_score: number;
  destination_id: string | null;
  area_id: string | null;
  activity_type_id: string | null;
  legacy_experience_id: string | null;
  best_for: string[] | null;
  pair_with_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  description: string;
  tier: string;
  format_type: string;
  duration: string;
  group_size: string;
  is_active: boolean;
  display_order: number;
  price_options: PriceOption[];
}

export interface PriceOption {
  id: string;
  option_id: string;
  label: string;
  currency: string;
  amount: number;
  original_amount: number | null;
  is_active: boolean;
  display_order: number;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  latitude: number | null;
  longitude: number | null;
  airport_code: string;
  is_active: boolean;
  legacy_city_id: string | null;
  country_id: string | null;
  flag_emoji: string;
  flag_svg_url: string;
}

export interface Area {
  id: string;
  name: string;
  slug: string;
  destination_id: string;
  description: string;
  cover_image: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface ActivityType {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  icon_image: string;
  display_order: number;
  is_active: boolean;
  legacy_category_id: string | null;
}

export interface Host {
  id: string;
  username: string;
  display_name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  social_links: Record<string, string>;
  destination_id: string | null;
  area_id: string | null;
  is_verified: boolean;
  is_active: boolean;
  legacy_creator_id: string | null;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  is_public_page: boolean;
  is_active: boolean;
}

// ============ HOOKS ============

export const useDestinations = () => {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async (): Promise<Destination[]> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) { console.error("Failed to fetch destinations:", error); return []; }
      return (data || []) as unknown as Destination[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDestinationBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["destination", slug],
    queryFn: async (): Promise<Destination | null> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) return null;
      return data as unknown as Destination | null;
    },
    enabled: !!slug,
  });
};

export const useAreas = (destinationId?: string) => {
  return useQuery({
    queryKey: ["areas", destinationId],
    queryFn: async (): Promise<Area[]> => {
      let query = supabase.from("areas").select("*").eq("is_active", true).order("display_order");
      if (destinationId) query = query.eq("destination_id", destinationId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []) as unknown as Area[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useActivityTypes = () => {
  return useQuery({
    queryKey: ["activity-types"],
    queryFn: async (): Promise<ActivityType[]> => {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) return [];
      return (data || []) as unknown as ActivityType[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useThemes = () => {
  return useQuery({
    queryKey: ["themes"],
    queryFn: async (): Promise<Theme[]> => {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) return [];
      return (data || []) as unknown as Theme[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProducts = (filters?: { destinationId?: string; areaId?: string; activityTypeId?: string }) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase.from("products").select("*").eq("is_active", true);
      if (filters?.destinationId) query = query.eq("destination_id", filters.destinationId);
      if (filters?.areaId) query = query.eq("area_id", filters.areaId);
      if (filters?.activityTypeId) query = query.eq("activity_type_id", filters.activityTypeId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []) as unknown as Product[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) return null;
      return data as unknown as Product | null;
    },
    enabled: !!slug,
  });
};

export const useProductOptions = (productId: string) => {
  return useQuery({
    queryKey: ["product-options", productId],
    queryFn: async (): Promise<ProductOption[]> => {
      const { data: opts, error } = await supabase
        .from("options")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("display_order");
      if (error || !opts) return [];

      const optionIds = opts.map(o => o.id);
      const { data: prices } = await supabase
        .from("price_options")
        .select("*")
        .in("option_id", optionIds)
        .eq("is_active", true)
        .order("display_order");

      return (opts as unknown as ProductOption[]).map(opt => ({
        ...opt,
        price_options: ((prices || []) as unknown as PriceOption[]).filter(p => p.option_id === opt.id),
      }));
    },
    enabled: !!productId,
  });
};

export const useProductHosts = (productId: string) => {
  return useQuery({
    queryKey: ["product-hosts", productId],
    queryFn: async (): Promise<Host[]> => {
      const { data, error } = await supabase
        .from("product_hosts")
        .select("host_id, display_order, hosts(*)")
        .eq("product_id", productId)
        .order("display_order");
      if (error || !data) return [];
      return data.map((r: any) => r.hosts).filter(Boolean) as unknown as Host[];
    },
    enabled: !!productId,
  });
};

export const useHosts = () => {
  return useQuery({
    queryKey: ["all-hosts-v2"],
    queryFn: async (): Promise<Host[]> => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*")
        .eq("is_active", true)
        .order("display_name");
      if (error) return [];
      return (data || []) as unknown as Host[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useHostBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["host", slug],
    queryFn: async (): Promise<Host | null> => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) return null;
      return data as unknown as Host | null;
    },
    enabled: !!slug,
  });
};
