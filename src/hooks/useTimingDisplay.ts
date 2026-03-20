import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { deriveTimingDisplay, normalizeHourlyScores } from "@/lib/timing";
import type { TimingProfileRecord, TimingDisplayOutput } from "@/lib/timing";

/**
 * Batch-fetches default timing display for all products.
 * Returns a map: productId → TimingDisplayOutput
 */
export const useTimingDisplayMap = () => {
  const { data: map = {} } = useQuery({
    queryKey: ["timing-display-map"],
    queryFn: async (): Promise<Record<string, TimingDisplayOutput>> => {
      const { data } = await supabase
        .from("product_timing_profiles")
        .select("product_id, profile_type, profile_label, peak_start_hour, peak_end_hour, secondary_start_hour, secondary_end_hour, low_start_hour, low_end_hour, hourly_scores, flexibility_level, timing_note, confidence_score, reason_tags, local_timezone")
        .eq("is_active", true)
        .eq("profile_type", "default")
        .order("profile_type") as any;

      if (!data) return {};

      const result: Record<string, TimingDisplayOutput> = {};
      for (const row of data) {
        const display = deriveTimingDisplay(row as unknown as TimingProfileRecord);
        if (display) result[row.product_id] = display;
      }
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  return map;
};
