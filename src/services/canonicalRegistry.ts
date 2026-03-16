/**
 * Canonical URL Registry & Indexability Service
 * 
 * Determines canonical URL, page class, indexability, and sitemap inclusion
 * for every publishable entity.
 */

import { supabase } from "@/integrations/supabase/client";

export type PageClass =
  | "destination"
  | "area"
  | "product"
  | "itinerary"
  | "collection"
  | "host"
  | "poi"
  | "theme"
  | "map";

export type IndexabilityState =
  | "indexed"          // public, in sitemap
  | "noindex"          // renders but not indexed
  | "redirect"         // redirects to canonical
  | "not_found";       // 404

export interface CanonicalEntry {
  entity_type: PageClass;
  entity_id: string;
  canonical_url: string;
  indexability: IndexabilityState;
  sitemap_include: boolean;
  redirect_target?: string;
  page_class_priority: number;  // lower = higher priority to avoid cannibalization
}

// Priority order for anti-cannibalization
const PAGE_CLASS_PRIORITY: Record<PageClass, number> = {
  product: 1,
  destination: 2,
  itinerary: 3,
  collection: 4,
  host: 5,
  area: 6,
  theme: 7,
  poi: 8,
  map: 9,
};

const BASE_URL = "https://swam.app";

// ============ URL BUILDERS ============
export const buildCanonicalUrl = (
  pageClass: PageClass,
  slugParts: { slug: string; destinationSlug?: string; areaSlug?: string }
): string => {
  const { slug, destinationSlug, areaSlug } = slugParts;

  switch (pageClass) {
    case "destination":
      return `${BASE_URL}/${slug}`;
    case "area":
      return `${BASE_URL}/${destinationSlug}/${slug}`;
    case "product":
      return `${BASE_URL}/things-to-do/${destinationSlug || "explore"}/${slug}`;
    case "itinerary":
      return `${BASE_URL}/itineraries/${slug}`;
    case "collection":
      return `${BASE_URL}/collections/${slug}`;
    case "host":
      return `${BASE_URL}/hosts/${slug}`;
    case "poi":
      return destinationSlug
        ? `${BASE_URL}/things-to-do/${destinationSlug}/${slug}`
        : `${BASE_URL}/places/${slug}`;
    case "theme":
      return destinationSlug
        ? `${BASE_URL}/things-to-do/${destinationSlug}/theme/${slug}`
        : `${BASE_URL}/themes/${slug}`;
    case "map":
      return destinationSlug
        ? `${BASE_URL}/${destinationSlug}/map`
        : `${BASE_URL}/explore/map`;
    default:
      return `${BASE_URL}/${slug}`;
  }
};

// ============ CANONICAL DECISION LOGIC ============
export const resolveCanonical = (
  pageClass: PageClass,
  entity: {
    id: string;
    slug: string;
    is_active?: boolean;
    is_indexable?: boolean;
    publish_score?: number;
    destinationSlug?: string;
    areaSlug?: string;
  }
): CanonicalEntry => {
  const canonicalUrl = buildCanonicalUrl(pageClass, {
    slug: entity.slug,
    destinationSlug: entity.destinationSlug,
    areaSlug: entity.areaSlug,
  });

  const isActive = entity.is_active !== false;
  const isIndexable = entity.is_indexable !== false;
  const publishScore = entity.publish_score ?? 0;
  const meetsThreshold = publishScore >= 40;

  let indexability: IndexabilityState = "indexed";
  if (!isActive) indexability = "not_found";
  else if (!isIndexable || !meetsThreshold) indexability = "noindex";

  return {
    entity_type: pageClass,
    entity_id: entity.id,
    canonical_url: canonicalUrl,
    indexability,
    sitemap_include: indexability === "indexed",
    page_class_priority: PAGE_CLASS_PRIORITY[pageClass],
  };
};

// ============ LOG CANONICAL DECISION ============
export const logCanonicalDecision = async (
  entry: CanonicalEntry,
  reason: string
): Promise<void> => {
  try {
    await (supabase as any).from("canonical_decisions").upsert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      canonical_url: entry.canonical_url,
      is_indexable: entry.indexability === "indexed",
      reason,
      decided_at: new Date().toISOString(),
    }, {
      onConflict: "entity_type,entity_id",
    });
  } catch (err) {
    console.error("Failed to log canonical decision:", err);
  }
};

// ============ SLUG HISTORY ============
export const logSlugChange = async (
  entityType: string,
  entityId: string,
  oldSlug: string,
  newSlug: string,
  changedBy?: string
): Promise<void> => {
  if (oldSlug === newSlug) return;
  try {
    await (supabase as any).from("entity_slug_history").insert({
      entity_type: entityType,
      entity_id: entityId,
      old_slug: oldSlug,
      new_slug: newSlug,
      changed_by: changedBy || null,
    });
  } catch (err) {
    console.error("Failed to log slug change:", err);
  }
};

// ============ VALIDATE ROUTE PARAMETERS ============
export const validateRouteParams = (
  path: string,
  knownDestinations: string[],
  knownActivityTypes: string[]
): { valid: boolean; redirect?: string; canonical?: string } => {
  const segments = path.split("/").filter(Boolean);

  // /things-to-do/:dest/:area/:activity - validate activity exists
  if (segments[0] === "things-to-do" && segments.length === 4) {
    const activity = segments[3];
    if (!knownActivityTypes.includes(activity)) {
      return { valid: false, redirect: `/things-to-do/${segments[1]}` };
    }
  }

  // Single segment - check if it's a known destination
  if (segments.length === 1 && segments[0] !== "things-to-do") {
    if (!knownDestinations.includes(segments[0])) {
      // Could be a legacy route - return not_found
      return { valid: false };
    }
  }

  return { valid: true };
};
