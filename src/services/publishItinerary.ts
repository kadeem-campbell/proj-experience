// Publish flow: copy a private itinerary (and its `itinerary_items`) into the
// `public_itineraries` + `public_itinerary_items` tables so it can be viewed
// publicly. Re-publishing replaces the snapshot. Unpublish marks inactive.

import { supabase } from "@/integrations/supabase/client";
import type { Itinerary } from "@/hooks/useItineraries";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "itinerary";

const ensureUniqueSlug = async (
  baseSlug: string,
  excludeId?: string,
): Promise<string> => {
  let candidate = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase
      .from("public_itineraries")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
};

/**
 * Publish a private itinerary: upsert a row in `public_itineraries` keyed by
 * (creator_id, source_itinerary_id ≈ slug fallback) and replace its items.
 */
export const publishItineraryToPublic = async (
  itinerary: Itinerary,
  userId: string,
): Promise<{ ok: boolean; publicId?: string; slug?: string; error?: string }> => {
  try {
    // 1. Find or create the public_itineraries row owned by this user with
    //    a deterministic slug derived from the private itinerary name + id.
    const baseSlug = `${slugify(itinerary.name)}-${itinerary.id.slice(0, 6)}`;

    // Try to locate an existing publish record by slug ownership.
    const { data: existing } = await supabase
      .from("public_itineraries")
      .select("id, slug, creator_id")
      .eq("slug", baseSlug)
      .maybeSingle();

    let publicId: string;
    let finalSlug: string;

    if (existing && (existing as any).creator_id === userId) {
      publicId = existing.id;
      finalSlug = existing.slug;
      const { error: updateErr } = await supabase
        .from("public_itineraries")
        .update({
          name: itinerary.name,
          cover_image: itinerary.coverImage || "",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", publicId);
      if (updateErr) return { ok: false, error: updateErr.message };
    } else {
      finalSlug = await ensureUniqueSlug(baseSlug);
      const { data: inserted, error: insertErr } = await supabase
        .from("public_itineraries")
        .insert({
          name: itinerary.name,
          slug: finalSlug,
          cover_image: itinerary.coverImage || "",
          creator_id: userId,
          source_type: "user",
          is_active: true,
          tag: "popular",
        })
        .select("id, slug")
        .single();
      if (insertErr || !inserted) {
        return { ok: false, error: insertErr?.message || "Insert failed" };
      }
      publicId = inserted.id;
      finalSlug = inserted.slug;
    }

    // 2. Snapshot items from itinerary_items -> public_itinerary_items.
    //    First, replace by clearing the existing snapshot.
    await supabase
      .from("public_itinerary_items")
      .delete()
      .eq("public_itinerary_id", publicId);

    const { data: days } = await supabase
      .from("itinerary_days")
      .select("id, day_number")
      .eq("itinerary_id", itinerary.id)
      .order("day_number", { ascending: true });

    const dayMap = new Map<string, number>();
    (days || []).forEach((d: any) => dayMap.set(d.id, d.day_number || 1));

    const dayIds = Array.from(dayMap.keys());
    if (dayIds.length === 0) {
      return { ok: true, publicId, slug: finalSlug };
    }

    const { data: items } = await supabase
      .from("itinerary_items")
      .select(
        "day_id, display_order, entity_type, entity_id, custom_title, custom_description, notes, time_slot",
      )
      .in("day_id", dayIds)
      .order("display_order", { ascending: true });

    if (!items || items.length === 0) {
      return { ok: true, publicId, slug: finalSlug };
    }

    // Resolve product/poi metadata for snapshot enrichment (so PublicItinerary
    // can render even if the source product later changes).
    const productIds = items
      .filter((i: any) => i.entity_type === "product" && i.entity_id)
      .map((i: any) => i.entity_id as string);
    const poiIds = items
      .filter((i: any) => i.entity_type === "poi" && i.entity_id)
      .map((i: any) => i.entity_id as string);

    const productMeta: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, title, description, cover_image, location, category, price")
        .in("id", productIds);
      (prods || []).forEach((p: any) => (productMeta[p.id] = p));
    }
    const poiMeta: Record<string, any> = {};
    if (poiIds.length > 0) {
      const { data: pois } = await supabase
        .from("pois")
        .select("id, name, description, cover_image, location, category")
        .in("id", poiIds);
      (pois || []).forEach((p: any) => (poiMeta[p.id] = p));
    }

    const rows = items.map((item: any) => {
      const meta =
        item.entity_type === "product"
          ? productMeta[item.entity_id]
          : item.entity_type === "poi"
            ? poiMeta[item.entity_id]
            : null;
      return {
        public_itinerary_id: publicId,
        day_number: dayMap.get(item.day_id) || 1,
        display_order: item.display_order ?? 0,
        entity_type: item.entity_type,
        entity_id: item.entity_type === "custom" ? null : item.entity_id,
        custom_title: item.entity_type === "custom" ? item.custom_title : null,
        custom_description:
          item.entity_type === "custom" ? item.custom_description : null,
        title: meta?.title || meta?.name || null,
        description: meta?.description || null,
        image_url: meta?.cover_image || null,
        location: meta?.location || null,
        category: meta?.category || null,
        price: meta?.price || null,
        notes: item.notes || null,
        time_slot: item.time_slot || null,
      };
    });

    const { error: insertItemsErr } = await supabase
      .from("public_itinerary_items")
      .insert(rows);
    if (insertItemsErr) {
      return { ok: false, error: insertItemsErr.message };
    }

    return { ok: true, publicId, slug: finalSlug };
  } catch (err: any) {
    console.error("publishItineraryToPublic failed", err);
    return { ok: false, error: err?.message || "Unknown error" };
  }
};

/** Unpublish: mark the user's published snapshot inactive. */
export const unpublishItinerary = async (
  itinerary: Itinerary,
  userId: string,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const baseSlug = `${slugify(itinerary.name)}-${itinerary.id.slice(0, 6)}`;
    const { error } = await supabase
      .from("public_itineraries")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("slug", baseSlug)
      .eq("creator_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unknown error" };
  }
};
