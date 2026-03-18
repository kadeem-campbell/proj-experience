import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbCountry {
  id: string;
  name: string;
  slug: string;
  iso_code: string;
  iso_alpha2: string | null;
  flag_svg_url: string | null;
  is_active: boolean;
}

export interface DbDestination {
  id: string;
  name: string;
  slug: string;
  country_id: string | null;
  destination_type: string;
  cover_image: string | null;
  flag_svg_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  launch_status: string | null;
  launch_date: string | null;
  timezone: string | null;
  iata_code: string | null;
  currency_code: string | null;
}

export interface DbCategory {
  id: string;
  name: string;
  emoji: string;
  icon_image: string;
  description: string;
  display_order: number;
}

export interface DbCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  social_links: Record<string, string>;
  is_verified: boolean;
}

export const useDestinations = () => {
  return useQuery({
    queryKey: ["destinations"],
    queryFn: async (): Promise<DbDestination[]> => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) { console.error("Failed to fetch destinations:", error); return []; }
      return (data || []) as DbDestination[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/** @deprecated Use useDestinations() instead */
export const useCities = useDestinations;

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<DbCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) { console.error("Failed to fetch categories:", error); return []; }
      return (data || []) as DbCategory[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreators = () => {
  return useQuery({
    queryKey: ["creators"],
    queryFn: async (): Promise<DbCreator[]> => {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("is_active", true)
        .order("username");
      if (error) { console.error("Failed to fetch creators:", error); return []; }
      return (data || []) as DbCreator[];
    },
    staleTime: 10 * 60 * 1000,
  });
};
