/**
 * Centralized Analytics & Interaction Tracking Service
 * 
 * Tracks all user interactions as warehouse-ready events.
 * Writes to interaction_events for raw events, plus fact tables for
 * warehouse-grade analytics (fact_pageviews, fact_booking_intents).
 * Supports identity stitching via identity_map.
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

const getDeviceType = (): string => {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
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
    eventQueue = [...batch.slice(0, 50), ...eventQueue].slice(0, 100);
  }
};

const scheduleFlush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, 2000);
};

// Identity stitching: link anonymous to authenticated
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

export const trackEvent = async ({
  event_type,
  entity_type,
  entity_id,
  metadata = {},
}: TrackEventParams): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const anonymousId = getAnonymousId();
  const sid = getSessionId();

  // Identity stitch on authenticated events
  if (user?.id) {
    stitchIdentity(user.id);
  }

  const event = {
    event_type,
    entity_type,
    entity_id,
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

  // High-frequency events get batched
  const batchEvents: EventType[] = ["map_pan", "map_zoom", "filter_interaction", "media_interaction"];
  if (batchEvents.includes(event_type)) {
    eventQueue.push(event);
    scheduleFlush();
    return;
  }

  // Critical events fire immediately
  try {
    await (supabase as any).from("interaction_events").insert(event);

    // Also write to warehouse fact tables
    if (event_type === "page_view") {
      await (supabase as any).from("fact_pageviews").insert({
        session_id: sid,
        user_id: user?.id || null,
        anonymous_id: anonymousId,
        entity_id,
        entity_type,
        page_url: window.location.pathname,
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        locale: navigator.language,
      });
    }

    if (event_type === "booking_intent") {
      await (supabase as any).from("fact_booking_intents").insert({
        session_id: sid,
        user_id: user?.id || null,
        product_id: entity_id,
        option_id: metadata.option_id || null,
        intent_stage: metadata.stage || "view_price",
        metadata,
      });
    }
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

export const trackBookingIntent = (productId: string, optionId?: string, stage?: string) =>
  trackEvent({ event_type: "booking_intent", entity_type: "product", entity_id: productId, metadata: { option_id: optionId, stage: stage || "view_price" } });

export const trackHostClick = (hostId: string, fromEntity?: { type: EntityType; id: string }) =>
  trackEvent({ event_type: "host_click", entity_type: "host", entity_id: hostId, metadata: { from: fromEntity } });

export const trackSearch = (query: string, resultCount: number) =>
  trackEvent({ event_type: "internal_search", entity_type: "product", entity_id: "search", metadata: { query, result_count: resultCount } });

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushQueue);
}
