/**
 * Centralized Analytics & Interaction Tracking Service
 * 
 * Tracks all user interactions as warehouse-ready events.
 * Uses interaction_events table as the canonical store.
 */

import { supabase } from "@/integrations/supabase/client";

// Session ID persisted per browser session
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

// Anonymous ID persisted across sessions
const getAnonymousId = (): string => {
  let anonId = localStorage.getItem("swam_anon_id");
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("swam_anon_id", anonId);
  }
  return anonId;
};

export type EventType =
  | "page_view"
  | "save"
  | "unsave"
  | "share"
  | "compare_options"
  | "map_open"
  | "map_pan"
  | "map_zoom"
  | "pin_click"
  | "itinerary_copy"
  | "itinerary_remix"
  | "booking_intent"
  | "start_booking"
  | "complete_booking"
  | "host_click"
  | "internal_search"
  | "filter_interaction"
  | "media_interaction"
  | "question_submit";

export type EntityType =
  | "product"
  | "destination"
  | "area"
  | "itinerary"
  | "collection"
  | "host"
  | "poi"
  | "theme";

interface TrackEventParams {
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  metadata?: Record<string, any>;
}

// Batch queue for high-frequency events
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
    // Re-queue failed events (up to 50)
    eventQueue = [...batch.slice(0, 50), ...eventQueue].slice(0, 100);
  }
};

const scheduleFlush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, 2000);
};

export const trackEvent = async ({
  event_type,
  entity_type,
  entity_id,
  metadata = {},
}: TrackEventParams): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  const event = {
    event_type,
    entity_type,
    entity_id,
    user_id: user?.id || null,
    session_id: getSessionId(),
    metadata: {
      ...metadata,
      anonymous_id: getAnonymousId(),
      page_url: window.location.pathname,
      referrer: document.referrer || null,
      locale: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    },
  };

  // High-frequency events (map interactions) get batched
  const batchEvents: EventType[] = ["map_pan", "map_zoom", "filter_interaction", "media_interaction"];
  if (batchEvents.includes(event_type)) {
    eventQueue.push(event);
    scheduleFlush();
    return;
  }

  // Critical events fire immediately
  try {
    await (supabase as any).from("interaction_events").insert(event);
  } catch (err) {
    console.error(`Analytics track failed [${event_type}]:`, err);
  }
};

// Convenience helpers
export const trackPageView = (entity_type: EntityType, entity_id: string, extra?: Record<string, any>) =>
  trackEvent({ event_type: "page_view", entity_type, entity_id, metadata: extra });

export const trackSave = (entity_type: EntityType, entity_id: string) =>
  trackEvent({ event_type: "save", entity_type, entity_id });

export const trackShare = (entity_type: EntityType, entity_id: string, platform?: string) =>
  trackEvent({ event_type: "share", entity_type, entity_id, metadata: { platform } });

export const trackBookingIntent = (productId: string, optionId?: string) =>
  trackEvent({ event_type: "booking_intent", entity_type: "product", entity_id: productId, metadata: { option_id: optionId } });

export const trackHostClick = (hostId: string, fromEntity?: { type: EntityType; id: string }) =>
  trackEvent({ event_type: "host_click", entity_type: "host", entity_id: hostId, metadata: { from: fromEntity } });

export const trackSearch = (query: string, resultCount: number) =>
  trackEvent({ event_type: "internal_search", entity_type: "product", entity_id: "search", metadata: { query, result_count: resultCount } });

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushQueue);
}
