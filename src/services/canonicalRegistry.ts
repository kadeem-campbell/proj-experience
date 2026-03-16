/**
 * Canonical URL Registry, Indexability & Route Resolution Service
 * 
 * Single source of truth for:
 * - canonical URL generation per page class
 * - indexability state → robots directive
 * - route-priority conflict resolution (with area activity, destination activity subclasses)
 * - slug history & alias handling
 * - page contract definitions
 * - runtime canonical resolution from persistent registry
 */

import { supabase } from "@/integrations/supabase/client";

// ============ TYPE DEFINITIONS ============

export type PageClass =
  | "product"
  | "area_activity"
  | "area"
  | "destination_activity"
  | "destination"
  | "curated_collection"
  | "itinerary"
  | "host"
  | "theme"
  | "poi"
  | "traveler"
  | "map_hub";

export type IndexabilityState =
  | "internal_only"
  | "public_noindex"
  | "public_indexed"
  | "deprecated_redirect"
  | "merged_redirect"
  | "suppressed_duplicate"
  | "draft_unpublished"
  | "blocked_low_readiness";

export interface CanonicalDecision {
  winningPageType: PageClass;
  winningUrl: string;
  robotsDirective: string;
  redirectAction: "none" | "301" | "404" | "410";
  redirectTarget?: string;
  indexability: IndexabilityState;
  sitemapInclude: boolean;
  losingCandidates: Array<{
    pageType: PageClass;
    url: string;
    action: "noindex" | "301" | "404" | "hold_unpublished";
  }>;
}

export interface RouteValidationResult {
  valid: boolean;
  redirect?: string;
  statusCode: 200 | 301 | 404 | 410;
  canonical?: string;
  reason?: string;
}

export interface RuntimeCanonical {
  canonical_url: string;
  indexability_state: IndexabilityState;
  robots: string;
  page_type: string;
}

// ============ CONSTANTS ============

const BASE_URL = "https://swam.app";

/**
 * Route priority — lower number = higher priority.
 * Now includes area_activity, destination_activity, curated_collection, traveler.
 */
const ROUTE_PRIORITY: Record<PageClass, number> = {
  product: 1,
  area_activity: 2,
  area: 3,
  destination_activity: 4,
  destination: 5,
  curated_collection: 6,
  itinerary: 7,
  host: 8,
  theme: 9,
  poi: 10,
  traveler: 11,
  map_hub: 12,
};

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
    case "area_activity":
      return `${BASE_URL}/things-to-do/${destinationSlug}/${areaSlug}/${slug}`;
    case "destination_activity":
      return `${BASE_URL}/things-to-do/${destinationSlug}/${slug}`;
    case "product":
      return `${BASE_URL}/things-to-do/${destinationSlug || "explore"}/${slug}`;
    case "itinerary":
      return `${BASE_URL}/itineraries/${slug}`;
    case "curated_collection":
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
    case "traveler":
      return `${BASE_URL}/travelers/${slug}`;
    case "map_hub":
      return `${BASE_URL}/${destinationSlug || "zanzibar"}/map`;
    default:
      return `${BASE_URL}/${slug}`;
  }
};

// ============ INDEXABILITY → ROBOTS DIRECTIVE ============

export const indexabilityToRobots = (state: IndexabilityState): string => {
  switch (state) {
    case "public_indexed":
      return "index,follow";
    case "public_noindex":
      return "noindex,follow";
    case "internal_only":
    case "draft_unpublished":
    case "blocked_low_readiness":
    case "suppressed_duplicate":
      return "noindex,nofollow";
    case "deprecated_redirect":
    case "merged_redirect":
      return "noindex,follow";
    default:
      return "noindex,nofollow";
  }
};

// ============ INDEXABILITY → RENDER BEHAVIOR ============

export const shouldRenderPage = (state: IndexabilityState, isAdmin: boolean): boolean => {
  switch (state) {
    case "public_indexed":
    case "public_noindex":
      return true;
    case "internal_only":
    case "draft_unpublished":
    case "blocked_low_readiness":
      return isAdmin;
    case "deprecated_redirect":
    case "merged_redirect":
    case "suppressed_duplicate":
      return false;
    default:
      return false;
  }
};

// ============ RUNTIME CANONICAL RESOLUTION ============

/**
 * Resolve canonical from persistent page_route_registry before render.
 * This is called by pages to get their canonical URL and robots directive.
 */
export const resolveRuntimeCanonical = async (
  entityType: string,
  entityId: string,
): Promise<RuntimeCanonical | null> => {
  try {
    const { data } = await (supabase as any)
      .from("page_route_registry")
      .select("canonical_url, indexability_state, page_type")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("status", "active")
      .single();

    if (!data) return null;

    return {
      canonical_url: data.canonical_url,
      indexability_state: data.indexability_state as IndexabilityState,
      robots: indexabilityToRobots(data.indexability_state as IndexabilityState),
      page_type: data.page_type,
    };
  } catch {
    return null;
  }
};

/**
 * Resolve canonical by path (for redirect handler).
 */
export const resolveCanonicalByPath = async (
  path: string,
): Promise<RuntimeCanonical | null> => {
  try {
    const { data } = await (supabase as any)
      .from("page_route_registry")
      .select("canonical_url, indexability_state, page_type, redirect_target_url")
      .eq("resolved_path", path)
      .eq("status", "active")
      .single();

    if (!data) return null;

    return {
      canonical_url: data.redirect_target_url || data.canonical_url,
      indexability_state: data.indexability_state as IndexabilityState,
      robots: indexabilityToRobots(data.indexability_state as IndexabilityState),
      page_type: data.page_type,
    };
  } catch {
    return null;
  }
};

// ============ CANONICAL CONFLICT RESOLVER ============

export const resolveCanonicalPage = (
  candidates: Array<{
    pageType: PageClass;
    entityId: string;
    slug: string;
    destinationSlug?: string;
    indexability: IndexabilityState;
    publishScore: number;
  }>
): CanonicalDecision => {
  const sorted = [...candidates].sort((a, b) => {
    const priorityDiff = ROUTE_PRIORITY[a.pageType] - ROUTE_PRIORITY[b.pageType];
    if (priorityDiff !== 0) return priorityDiff;
    // Same class: higher publish score wins
    if (b.publishScore !== a.publishScore) return b.publishScore - a.publishScore;
    // Tie-break: indexed wins over noindex
    if (a.indexability === "public_indexed" && b.indexability !== "public_indexed") return -1;
    if (b.indexability === "public_indexed" && a.indexability !== "public_indexed") return 1;
    return 0;
  });

  const winner = sorted[0];
  const losers = sorted.slice(1);

  const winningUrl = buildCanonicalUrl(winner.pageType, {
    slug: winner.slug,
    destinationSlug: winner.destinationSlug,
  });

  const isPublishable = winner.publishScore >= 40;
  const finalIndexability: IndexabilityState =
    winner.indexability === "public_indexed" && isPublishable
      ? "public_indexed"
      : "public_noindex";

  return {
    winningPageType: winner.pageType,
    winningUrl,
    robotsDirective: indexabilityToRobots(finalIndexability),
    redirectAction: "none",
    indexability: finalIndexability,
    sitemapInclude: finalIndexability === "public_indexed",
    losingCandidates: losers.map(l => {
      const lUrl = buildCanonicalUrl(l.pageType, { slug: l.slug, destinationSlug: l.destinationSlug });
      // Determine loser action
      let action: "noindex" | "301" | "404" | "hold_unpublished";
      if (l.indexability === "deprecated_redirect" || l.indexability === "merged_redirect") {
        action = "301";
      } else if (l.indexability === "public_indexed") {
        action = "noindex"; // suppress duplicate
      } else {
        action = "hold_unpublished";
      }
      return { pageType: l.pageType, url: lUrl, action };
    }),
  };
};

// ============ ROUTE PARAMETER VALIDATION ============

export const validateRouteParams = (
  path: string,
  knownDestinations: string[],
  knownAreas: Map<string, string[]>,
  knownActivityTypes: string[],
): RouteValidationResult => {
  const segments = path.split("/").filter(Boolean);

  // /things-to-do/:dest/:area/:activity
  if (segments[0] === "things-to-do" && segments.length === 4) {
    const [, dest, area, activity] = segments;
    if (!knownDestinations.includes(dest)) {
      return { valid: false, statusCode: 404, reason: "unknown_destination" };
    }
    const destAreas = knownAreas.get(dest) || [];
    if (!destAreas.includes(area)) {
      return { valid: false, statusCode: 404, reason: "area_not_in_destination" };
    }
    if (!knownActivityTypes.includes(activity)) {
      return {
        valid: false, statusCode: 301,
        redirect: `/things-to-do/${dest}/${area}`,
        reason: "unknown_activity_type",
      };
    }
    return { valid: true, statusCode: 200 };
  }

  // /things-to-do/:dest/:slug
  if (segments[0] === "things-to-do" && segments.length === 3) {
    return { valid: true, statusCode: 200 };
  }

  // /:dest/:area
  if (segments.length === 2 && !["things-to-do", "hosts", "itineraries", "collections", "my-trips", "travelers"].includes(segments[0])) {
    const [dest, area] = segments;
    if (!knownDestinations.includes(dest)) {
      return { valid: false, statusCode: 404, reason: "unknown_destination" };
    }
    const destAreas = knownAreas.get(dest) || [];
    if (!destAreas.includes(area) && area !== "map") {
      return { valid: false, statusCode: 404, reason: "area_not_in_destination" };
    }
    return { valid: true, statusCode: 200 };
  }

  return { valid: true, statusCode: 200 };
};

// ============ LOG CANONICAL DECISION ============

export const logCanonicalDecision = async (
  entityType: string,
  entityId: string,
  canonicalUrl: string,
  isIndexable: boolean,
  reason: string,
): Promise<void> => {
  try {
    await (supabase as any).from("canonical_decisions").upsert({
      entity_type: entityType,
      entity_id: entityId,
      canonical_url: canonicalUrl,
      is_indexable: isIndexable,
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
  changedBy?: string,
  reason: string = "rename",
): Promise<void> => {
  if (oldSlug === newSlug) return;
  try {
    await (supabase as any).from("entity_slug_history").update({ is_current: false })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_current", true);

    await (supabase as any).from("entity_slug_history").insert({
      entity_type: entityType,
      entity_id: entityId,
      old_slug: oldSlug,
      new_slug: newSlug,
      is_current: true,
      redirect_to_slug: newSlug,
      reason,
      changed_by: changedBy || null,
    });
  } catch (err) {
    console.error("Failed to log slug change:", err);
  }
};

// ============ REGISTER PAGE ROUTE ============

export const registerPageRoute = async (
  pageType: PageClass,
  entityId: string,
  entityType: string,
  slug: string,
  destinationSlug?: string,
  indexabilityState: IndexabilityState = "draft_unpublished",
  publishScore: number = 0,
): Promise<void> => {
  const resolvedPath = buildCanonicalUrl(pageType, { slug, destinationSlug }).replace(BASE_URL, "");
  const canonicalUrl = buildCanonicalUrl(pageType, { slug, destinationSlug });
  const routePriority = ROUTE_PRIORITY[pageType];

  try {
    await (supabase as any).from("page_route_registry").upsert({
      page_type: pageType,
      entity_id: entityId,
      entity_type: entityType,
      resolved_path: resolvedPath,
      canonical_url: canonicalUrl,
      route_priority: routePriority,
      indexability_state: indexabilityState,
      status: "active",
      generated_from_rule: `auto_${pageType}`,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "entity_type,entity_id",
    });
  } catch (err) {
    console.error("Failed to register page route:", err);
  }
};

// ============ AUDIT LOG ============

export const logAdminAction = async (
  actionType: string,
  entityType?: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("admin_audit_log").insert({
      user_id: user?.id || null,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
    });
  } catch { /* best effort */ }
};

// ============ PAGE CONTRACT DEFINITIONS ============

export interface PageContractField {
  field: string;
  required: boolean;
  description: string;
}

export const PAGE_CONTRACTS: Record<string, PageContractField[]> = {
  destination: [
    { field: "title", required: true, description: "Page title" },
    { field: "summary", required: true, description: "Destination description" },
    { field: "hero_media", required: true, description: "Cover image" },
    { field: "schema", required: true, description: "TouristDestination JSON-LD" },
    { field: "internal_links_areas", required: true, description: "Links to areas" },
    { field: "internal_links_things_to_do", required: true, description: "Links to things-to-do" },
    { field: "canonical_tag", required: true, description: "Canonical URL tag" },
    { field: "breadcrumbs", required: true, description: "Breadcrumb navigation" },
  ],
  area: [
    { field: "area_identity", required: true, description: "Area name and context" },
    { field: "parent_destination", required: true, description: "Parent destination link" },
    { field: "summary", required: true, description: "Area description" },
    { field: "canonical_tag", required: true, description: "Canonical URL tag" },
    { field: "breadcrumbs", required: true, description: "Breadcrumb navigation" },
    { field: "schema", required: true, description: "Place JSON-LD" },
  ],
  product: [
    { field: "product_identity", required: true, description: "Title and slug" },
    { field: "product_summary", required: true, description: "Description" },
    { field: "activity_type", required: true, description: "Activity type assignment" },
    { field: "location_scope", required: true, description: "Destination/area context" },
    { field: "pricing_module", required: true, description: "Option and price display" },
    { field: "media_module", required: true, description: "Gallery and video" },
    { field: "faq_questions", required: true, description: "FAQ section" },
    { field: "booking_cta", required: true, description: "Booking/request CTA" },
    { field: "canonical_tag", required: true, description: "Canonical URL tag" },
    { field: "schema", required: true, description: "Product/TouristAttraction JSON-LD" },
    { field: "structured_highlights", required: true, description: "Highlights list" },
  ],
  itinerary: [
    { field: "creator", required: true, description: "Creator attribution" },
    { field: "item_list", required: true, description: "List of items" },
    { field: "destination_context", required: true, description: "Destination context" },
    { field: "canonical_tag", required: true, description: "Canonical URL" },
    { field: "schema", required: true, description: "ItemList JSON-LD" },
    { field: "save_share_block", required: true, description: "Save/share UI" },
  ],
  collection: [
    { field: "reason", required: true, description: "Why this collection exists" },
    { field: "member_list", required: true, description: "Collection members" },
    { field: "collection_intro", required: true, description: "Intro text" },
    { field: "canonical_tag", required: true, description: "Canonical URL" },
    { field: "schema", required: true, description: "CollectionPage JSON-LD" },
  ],
  host: [
    { field: "host_identity", required: true, description: "Name and avatar" },
    { field: "bio", required: true, description: "Bio / description" },
    { field: "canonical_tag", required: true, description: "Canonical URL" },
    { field: "schema", required: true, description: "LocalBusiness JSON-LD" },
  ],
};

// ============ CRAWL POLICY BY CONTENT CLASS ============

export interface CrawlPolicy {
  searchEngineCrawl: boolean;
  aiCrawlerAllowed: boolean;
  snippetAllowed: boolean;
  imageIndexing: boolean;
  feedExport: boolean;
}

export const CRAWL_POLICIES: Record<string, CrawlPolicy> = {
  destination: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  area: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  area_activity: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  destination_activity: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  product: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: true },
  itinerary: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  curated_collection: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: false, feedExport: false },
  host: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  poi: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: true, feedExport: false },
  theme: { searchEngineCrawl: true, aiCrawlerAllowed: true, snippetAllowed: true, imageIndexing: false, feedExport: false },
  traveler: { searchEngineCrawl: false, aiCrawlerAllowed: false, snippetAllowed: false, imageIndexing: false, feedExport: false },
  map_hub: { searchEngineCrawl: true, aiCrawlerAllowed: false, snippetAllowed: false, imageIndexing: false, feedExport: false },
};
