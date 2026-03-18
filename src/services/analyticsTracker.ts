/**
 * Centralized Analytics & Interaction Tracking Service v2
 * 
 * Writes to:
 * - interaction_events (raw events)
 * - fact_pageviews (warehouse pageviews)
 * - fact_booking_intents (warehouse booking intent)
 * - search_queries (search telemetry)
 * - session_profiles (session aggregation)
 * - identity_map (anonymous → auth stitching)
 */

import { supabase } from "@/integrations/supabase/client";

// ============ SESSION MANAGEMENT ============

let sessionId: string | null = null;
const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("swam_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("swam_session_id", sessionId);
    }
  }
  return sessionId;
};

const getAnonymousId = (): string => {
  let anonId = localStorage.getItem("swam_anon_id");
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("swam_anon_id", anonId);
  }
  return anonId;
};

const getDeviceType = (): string => {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

// ============ EVENT TYPES ============

export type EventType =
  | "page_view" | "save" | "unsave" | "share"
  | "compare_options" | "map_open" | "map_pan" | "map_zoom" | "pin_click"
  | "itinerary_copy" | "itinerary_remix" | "itinerary_create"
  | "booking_intent" | "start_booking" | "complete_booking"
  | "host_click" | "host_follow"
  | "internal_search" | "filter_interaction" | "media_interaction"
  | "question_submit" | "question_answer"
  | "recommendation_click" | "recommendation_dismiss"
  | "planner_prompt" | "planner_accept_suggestion";

export type EntityType =
  | "product" | "destination" | "area" | "itinerary"
  | "collection" | "host" | "poi" | "theme" | "search";

interface TrackEventParams {
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  metadata?: Record<string, any>;
}

// ============ BATCH QUEUE ============

let eventQueue: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushQueue = async () => {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];
  try {
    await (supabase as any).from("interaction_events").insert(batch);
  } catch (err) {
    console.error("Analytics flush failed:", err);
    eventQueue = [...batch.slice(0, 50), ...eventQueue].slice(0, 100);
  }
};

const scheduleFlush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, 2000);
};

// ============ IDENTITY STITCHING ============

const stitchIdentity = async (userId: string) => {
  const anonymousId = getAnonymousId();
  try {
    await (supabase as any).from("identity_map").upsert({
      anonymous_id: anonymousId,
      user_id: userId,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "anonymous_id,user_id" });
  } catch { /* best effort */ }
};

// ============ SESSION PROFILE UPDATE ============

const updateSessionProfile = async (userId: string | null) => {
  const sid = getSessionId();
  try {
    await (supabase as any).from("session_profiles").upsert({
      session_id: sid,
      user_id: userId,
      last_seen: new Date().toISOString(),
      page_count: 1, // incremented server-side ideally
    }, { onConflict: "session_id" });
  } catch { /* best effort */ }
};

// ============ MAIN TRACK FUNCTION ============

export const trackEvent = async ({
  event_type, entity_type, entity_id, metadata = {},
}: TrackEventParams): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const anonymousId = getAnonymousId();
  const sid = getSessionId();

  if (user?.id) stitchIdentity(user.id);

  const event = {
    event_type, entity_type, entity_id,
    user_id: user?.id || null,
    session_id: sid,
    metadata: {
      ...metadata,
      anonymous_id: anonymousId,
      page_url: window.location.pathname,
      referrer: document.referrer || null,
      locale: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      device_type: getDeviceType(),
      timestamp: new Date().toISOString(),
    },
  };

  const batchEvents: EventType[] = ["map_pan", "map_zoom", "filter_interaction", "media_interaction"];
  if (batchEvents.includes(event_type)) {
    eventQueue.push(event);
    scheduleFlush();
    return;
  }

  try {
    await (supabase as any).from("interaction_events").insert(event);

    // Warehouse writes
    if (event_type === "page_view") {
      await Promise.all([
        (supabase as any).from("fact_pageviews").insert({
          session_id: sid, user_id: user?.id || null,
          anonymous_id: anonymousId, entity_id, entity_type,
          page_url: window.location.pathname,
          referrer: document.referrer || null,
          device_type: getDeviceType(),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          locale: navigator.language,
        }),
        updateSessionProfile(user?.id || null),
      ]);
    }

    if (event_type === "booking_intent") {
      await (supabase as any).from("fact_booking_intents").insert({
        session_id: sid, user_id: user?.id || null,
        product_id: entity_id,
        option_id: metadata.option_id || null,
        intent_stage: metadata.stage || "view_price",
        metadata,
      });
    }

    if (event_type === "internal_search") {
      await (supabase as any).from("search_queries").insert({
        session_id: sid, user_id: user?.id || null,
        raw_query: metadata.query || "",
        normalised_query: (metadata.query || "").toLowerCase().trim(),
        result_count: metadata.result_count || 0,
        detected_location_json: metadata.detected_location || null,
        detected_dimensions_json: metadata.detected_dimensions || null,
      });
    }
  } catch (err) {
    console.error(`Analytics track failed [${event_type}]:`, err);
  }
};

// ============ CONVENIENCE HELPERS ============

export const trackPageView = (entity_type: EntityType, entity_id: string, extra?: Record<string, any>) =>
  trackEvent({ event_type: "page_view", entity_type, entity_id, metadata: extra });

export const trackSave = (entity_type: EntityType, entity_id: string) =>
  trackEvent({ event_type: "save", entity_type, entity_id });

export const trackShare = (entity_type: EntityType, entity_id: string, platform?: string) =>
  trackEvent({ event_type: "share", entity_type, entity_id, metadata: { platform } });

export const trackBookingIntent = (productId: string, optionId?: string, stage?: string) =>
  trackEvent({ event_type: "booking_intent", entity_type: "product", entity_id: productId, metadata: { option_id: optionId, stage: stage || "view_price" } });

export const trackHostClick = (hostId: string, fromEntity?: { type: EntityType; id: string }) =>
  trackEvent({ event_type: "host_click", entity_type: "host", entity_id: hostId, metadata: { from: fromEntity } });

export const trackSearch = (query: string, resultCount: number, extra?: Record<string, any>) =>
  trackEvent({ event_type: "internal_search", entity_type: "search", entity_id: "search", metadata: { query, result_count: resultCount, ...extra } });

export const trackItineraryCopy = (itineraryId: string, sourceId?: string) =>
  trackEvent({ event_type: "itinerary_copy", entity_type: "itinerary", entity_id: itineraryId, metadata: { source_id: sourceId } });

export const trackRecommendationClick = (entityType: EntityType, entityId: string, recType: string) =>
  trackEvent({ event_type: "recommendation_click", entity_type: entityType, entity_id: entityId, metadata: { recommendation_type: recType } });

export const trackPlannerPrompt = (prompt: string, destinationId?: string) =>
  trackEvent({ event_type: "planner_prompt", entity_type: "search", entity_id: "planner", metadata: { prompt, destination_id: destinationId } });

// Flush on unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushQueue);
}
