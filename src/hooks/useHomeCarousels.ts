import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Carousel = a page-display module configured entirely in admin / DB.
 * Filtering rules:
 *  - destinationIds empty → global (matches any market)
 *  - destinationIds set   → only matches when selectedDestId ∈ list
 *  - categoryIds empty    → global (matches any category)
 *  - categoryIds set      → only matches when activeCategoryId ∈ list
 * Resolution modes:
 *  - 'manual'     → items come from carousel_items (typed: product/itinerary/poi/area)
 *  - 'collection' → items resolved by following collection refs in carousel_items
 *  - 'auto'       → items pulled from products matching market + category
 */
export interface HomeCarousel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contentType: "product" | "itinerary" | "poi" | "area" | "collection" | "mixed";
  pageLocation: string;
  displayOrder: number;
  destinationIds: string[];
  categoryIds: string[];
  resolutionMode: "manual" | "collection" | "auto";
  maxItems: number;
  /** Resolved item IDs, keyed by type. For 'auto' carousels these arrive empty
   *  and the UI fetches by market+category at render time. */
  manualItems: Array<{ type: "product" | "itinerary" | "poi" | "area"; id: string }>;
  collectionIds: string[];
}

export const useHomeCarousels = (pageLocation: string = "home") => {
  return useQuery({
    queryKey: ["carousels", pageLocation],
    queryFn: async (): Promise<HomeCarousel[]> => {
      const { data: carousels, error } = await (supabase as any)
        .from("carousels")
        .select("*")
        .eq("is_active", true)
        .eq("page_location", pageLocation)
        .order("display_order", { ascending: true });

      if (error || !carousels || carousels.length === 0) return [];

      const ids = carousels.map((c: any) => c.id);

      const [{ data: dests }, { data: cats }, { data: items }, { data: collItems }] = await Promise.all([
        (supabase as any).from("carousel_destinations").select("carousel_id, destination_id").in("carousel_id", ids),
        (supabase as any).from("carousel_categories").select("carousel_id, activity_type_id").in("carousel_id", ids),
        (supabase as any).from("carousel_items").select("carousel_id, item_type, item_id, position").in("carousel_id", ids).order("position"),
        // For carousels in 'collection' mode, also expand the underlying collection_items.
        // We do that in the consumer to keep this hook focused.
        Promise.resolve({ data: [] as any[] }),
      ]);

      const destByC: Record<string, string[]> = {};
      (dests || []).forEach((r: any) => { (destByC[r.carousel_id] ||= []).push(r.destination_id); });

      const catByC: Record<string, string[]> = {};
      (cats || []).forEach((r: any) => { (catByC[r.carousel_id] ||= []).push(r.activity_type_id); });

      const manualByC: Record<string, HomeCarousel["manualItems"]> = {};
      const collsByC: Record<string, string[]> = {};
      (items || []).forEach((r: any) => {
        if (r.item_type === "collection") {
          (collsByC[r.carousel_id] ||= []).push(r.item_id);
        } else {
          (manualByC[r.carousel_id] ||= []).push({ type: r.item_type, id: r.item_id });
        }
      });

      return carousels.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        contentType: c.content_type,
        pageLocation: c.page_location,
        displayOrder: c.display_order,
        destinationIds: destByC[c.id] || [],
        categoryIds: catByC[c.id] || [],
        resolutionMode: c.resolution_mode,
        maxItems: c.max_items ?? 10,
        manualItems: manualByC[c.id] || [],
        collectionIds: collsByC[c.id] || [],
      }));
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

/** Resolve a carousel against the active context (market + category). */
export const matchesContext = (
  c: HomeCarousel,
  selectedDestId: string | null,
  activeCategoryId: string | null,
): boolean => {
  // Market gate
  if (c.destinationIds.length > 0) {
    if (!selectedDestId) return false;
    if (!c.destinationIds.includes(selectedDestId)) return false;
  }
  // Category gate:
  //  - no category active → don't filter by category at all (show every carousel for the city)
  //  - category active     → carousel must either be global (no category restriction) or include that category
  if (activeCategoryId && c.categoryIds.length > 0) {
    if (!c.categoryIds.includes(activeCategoryId)) return false;
  }
  return true;
};

/** Homepage category pills come from the DB (admin-driven). */
export interface HomeCategory {
  id: string;
  name: string;
  iconUrl: string | null;
  displayOrder: number;
}

export const useHomeCategories = () => {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: async (): Promise<HomeCategory[]> => {
      const { data } = await (supabase as any)
        .from("activity_types")
        .select("id, name, icon_url, home_display_order")
        .eq("show_on_home", true)
        .order("home_display_order", { ascending: true });
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        iconUrl: r.icon_url || null,
        displayOrder: r.home_display_order ?? 100,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Resolve the final item-id list for a carousel given:
 *  - the carousel definition
 *  - product-level activity_type lookup (productCategoryMap: productId → activityTypeId)
 *  - all collection_items for any referenced collections
 *  - the current market context (used by 'auto' mode)
 *
 * Returns typed items in render order, capped at maxItems.
 */
export interface ResolvedItem { type: "product" | "itinerary" | "poi" | "area"; id: string }

export const resolveCarouselItems = (
  c: HomeCarousel,
  ctx: {
    selectedDestId: string | null;
    activeCategoryId: string | null;
    /** product_id → destination_id */
    productDestMap: Map<string, string | null>;
    /** product_id → activity_type_id */
    productCatMap: Map<string, string | null>;
    /** itinerary dbId → destination_id */
    itinDestMap: Map<string, string | null>;
    /** poi id → destination_id */
    poiDestMap: Map<string, string | null>;
    /** collection_id → array of {type,id} from collection_items (already typed) */
    collectionContents: Map<string, ResolvedItem[]>;
    /** collection_id → destination_ids; empty means all markets */
    collectionDestMap?: Map<string, string[]>;
    /** collection_id → activity_type_ids; empty means all categories */
    collectionCatMap?: Map<string, string[]>;
    /** All product ids (for 'auto' mode) */
    allProductIds: string[];
  }
): ResolvedItem[] => {
  let items: ResolvedItem[] = [];

  if (c.resolutionMode === "manual") {
    items = c.manualItems;
  } else if (c.resolutionMode === "collection") {
    c.collectionIds.forEach(cid => {
      const collectionDests = ctx.collectionDestMap?.get(cid) || [];
      const collectionCats = ctx.collectionCatMap?.get(cid) || [];
      if (ctx.selectedDestId && collectionDests.length > 0 && !collectionDests.includes(ctx.selectedDestId)) return;
      if (ctx.activeCategoryId && collectionCats.length > 0 && !collectionCats.includes(ctx.activeCategoryId)) return;
      const inner = ctx.collectionContents.get(cid);
      if (inner) items.push(...inner);
    });
  } else if (c.resolutionMode === "auto") {
    // Auto mode: pull products matching market + category
    items = ctx.allProductIds
      .filter(pid => {
        if (ctx.selectedDestId && ctx.productDestMap.get(pid) !== ctx.selectedDestId) return false;
        if (ctx.activeCategoryId && ctx.productCatMap.get(pid) !== ctx.activeCategoryId) return false;
        return true;
      })
      .map(id => ({ type: "product" as const, id }));
  }

  // Filter resolved items by current market context (auto already did this)
  if (c.resolutionMode !== "auto" && ctx.selectedDestId) {
    items = items.filter(it => {
      if (it.type === "product")   return ctx.productDestMap.get(it.id) === ctx.selectedDestId;
      if (it.type === "itinerary") return ctx.itinDestMap.get(it.id) === ctx.selectedDestId;
      if (it.type === "poi")       return ctx.poiDestMap.get(it.id) === ctx.selectedDestId;
      return true;
    });
  }
  // Filter by category (only products carry an activity_type)
  if (c.resolutionMode !== "auto" && ctx.activeCategoryId) {
    items = items.filter(it => {
      if (it.type !== "product") return true;
      return ctx.productCatMap.get(it.id) === ctx.activeCategoryId;
    });
  }

  // Dedupe and cap
  const seen = new Set<string>();
  const out: ResolvedItem[] = [];
  for (const it of items) {
    const key = `${it.type}:${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= c.maxItems) break;
  }
  return out;
};
