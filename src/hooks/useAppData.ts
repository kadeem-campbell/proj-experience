import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbCity {
  id: string;
  name: string;
  country: string;
  cover_image: string;
  airport_code: string;
  flag_emoji: string;
  flag_svg_url?: string | null;
  launch_date?: string | null;
  latitude: number;
  longitude: number;
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

export const useCities = () => {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<DbCity[]> => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) { console.error("Failed to fetch cities:", error); return []; }
      return (data || []) as DbCity[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

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
