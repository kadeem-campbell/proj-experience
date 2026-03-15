import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";

/**
 * Hook for tracking interaction events in the new entity graph.
 * All user interactions (views, clicks, saves, shares) flow through here
 * to build the behavioral graph for recommendations and analytics.
 */
export const useInteractions = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const sessionId = sessionStorage.getItem('swam_session_id') || 
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem('swam_session_id', id);
          return id;
        })();

      await (supabase as any).from("interaction_events").insert({
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {},
      });
    } catch (e) {
      // Non-blocking — analytics should never break UX
      console.debug("interaction_event failed:", e);
    }
  }, [user?.id]);

  return {
    trackPageView: (entityType: string, entityId: string, source?: string) =>
      trackEvent("page_view", entityType, entityId, { source }),
    trackImpression: (entityType: string, entityId: string, surface: string, position?: number) =>
      trackEvent("impression", entityType, entityId, { surface, position }),
    trackClick: (entityType: string, entityId: string, source: string) =>
      trackEvent("click", entityType, entityId, { source }),
    trackSave: (entityType: string, entityId: string, targetId?: string) =>
      trackEvent("save", entityType, entityId, { target_itinerary_id: targetId }),
    trackShare: (entityType: string, entityId: string, channel: string) =>
      trackEvent("share", entityType, entityId, { channel }),
    trackBookingIntent: (productId: string, optionId?: string) =>
      trackEvent("booking_intent", "product", productId, { option_id: optionId }),
    trackMapInteraction: (action: string, entitiesVisible?: string[]) =>
      trackEvent("map_interaction", "map", "global", { action, entities_visible: entitiesVisible }),
    trackSearch: (query: string, resultCount: number, filters?: Record<string, any>) =>
      trackEvent("search", "search", "global", { query, result_count: resultCount, filters }),
    trackEvent,
  };
};
