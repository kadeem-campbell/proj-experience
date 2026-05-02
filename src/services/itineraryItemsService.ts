// Helpers for writing user itinerary picks to the canonical `itinerary_items` table
// (entity-agnostic) while the rest of the app still reads the legacy JSONB mirror.
//
// Supported live entity types: 'product' | 'poi' | 'custom'. 'experience' is NOT supported.

import { supabase } from "@/integrations/supabase/client";

export type ItineraryEntityType = "product" | "poi" | "custom";

export interface ItineraryItemInput {
  entityType: ItineraryEntityType;
  entityId?: string | null;
  customTitle?: string | null;
  customDescription?: string | null;
  notes?: string | null;
  timeSlot?: string | null;
}

/**
 * Validate that an entity reference is supported. Returns null if valid,
 * otherwise a user-facing message explaining why the add was refused.
 */
export const validateEntityForItinerary = (
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  customTitle?: string | null,
): string | null => {
  if (entityType === "product" || entityType === "poi") {
    if (!entityId) return "This item isn't available yet. Try another Thing to do.";
    return null;
  }
  if (entityType === "custom") {
    if (!customTitle?.trim()) return "Custom items need a title.";
    return null;
  }
  // Anything else (including 'experience') is rejected.
  return "This item isn't available yet. Try another Thing to do.";
};

/**
 * Ensure an itinerary has at least one day row, returning its id.
 * Uses the lowest-numbered active day, creating "Day 1" if none exist.
 */
export const ensureDefaultDayId = async (itineraryId: string): Promise<string | null> => {
  const { data: existing } = await supabase
    .from("itinerary_days")
    .select("id, day_number")
    .eq("itinerary_id", itineraryId)
    .order("day_number", { ascending: true })
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error } = await supabase
    .from("itinerary_days")
    .insert({ itinerary_id: itineraryId, day_number: 1, title: "Day 1" })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Could not create default day for itinerary", itineraryId, error);
    return null;
  }
  return created.id;
};

/**
 * Upsert an item into `itinerary_items`. Returns true if it was newly inserted,
 * false if it already existed (de-duped by entity_type + entity_id within the day).
 * Fire-and-forget safe: failures are logged but never thrown.
 */
export const writeItineraryItem = async (
  itineraryId: string,
  input: ItineraryItemInput,
): Promise<boolean> => {
  try {
    const dayId = await ensureDefaultDayId(itineraryId);
    if (!dayId) return false;

    // Dedupe non-custom items by (day_id, entity_type, entity_id)
    if (input.entityType !== "custom" && input.entityId) {
      const { data: dupes } = await supabase
        .from("itinerary_items")
        .select("id")
        .eq("day_id", dayId)
        .eq("entity_type", input.entityType)
        .eq("entity_id", input.entityId)
        .limit(1);
      if (dupes && dupes.length > 0) return false;
    }

    // Compute next display_order for the day
    const { data: lastItems } = await supabase
      .from("itinerary_items")
      .select("display_order")
      .eq("day_id", dayId)
      .order("display_order", { ascending: false })
      .limit(1);
    const nextOrder = (lastItems?.[0]?.display_order ?? -1) + 1;

    const { error } = await supabase.from("itinerary_items").insert({
      day_id: dayId,
      entity_type: input.entityType,
      entity_id: input.entityType === "custom" ? null : input.entityId ?? null,
      custom_title: input.entityType === "custom" ? input.customTitle ?? null : null,
      custom_description: input.entityType === "custom" ? input.customDescription ?? null : null,
      notes: input.notes ?? null,
      time_slot: input.timeSlot ?? null,
      display_order: nextOrder,
      // Keep legacy product_id populated only when entity is a product, so any old
      // queries reading product_id continue to work during the transition.
      product_id: input.entityType === "product" ? input.entityId ?? null : null,
      poi_id: input.entityType === "poi" ? input.entityId ?? null : null,
      item_type: input.entityType,
    });

    if (error) {
      console.error("Error inserting itinerary_item", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("writeItineraryItem failed", err);
    return false;
  }
};

/** Remove an entity from an itinerary's items (across all its days). */
export const deleteItineraryItem = async (
  itineraryId: string,
  entityType: ItineraryEntityType,
  entityId: string,
): Promise<void> => {
  try {
    const { data: days } = await supabase
      .from("itinerary_days")
      .select("id")
      .eq("itinerary_id", itineraryId);
    const dayIds = (days || []).map((d) => d.id);
    if (dayIds.length === 0) return;
    await supabase
      .from("itinerary_items")
      .delete()
      .in("day_id", dayIds)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
  } catch (err) {
    console.error("deleteItineraryItem failed", err);
  }
};
