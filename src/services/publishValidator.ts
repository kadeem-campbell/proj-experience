/**
 * Weighted Publish Readiness Engine v2
 * 
 * Full multi-dimensional scoring with:
 * - 11 weighted dimensions (content, media, canonical, taxonomy, commerce, feed, graph, geo, qa, route, analytics)
 * - IndexabilityState thresholds from blocked_low_readiness → public_indexed
 * - Writes to readiness_scores and validation_results tables
 * - Per-entity-type weight profiles
 * - Blocker-aware gating
 */

import { supabase } from "@/integrations/supabase/client";
import type { IndexabilityState } from "./canonicalRegistry";

// ============ TYPES ============

export interface ValidationCheck {
  field: string;
  rule: string;
  passed: boolean;
  severity: "blocker" | "error" | "warning" | "info";
  message: string;
  dimension: ReadinessDimension;
  weight: number;
  suggested_fix?: string;
}

export type ReadinessDimension =
  | "content"
  | "media"
  | "canonical"
  | "taxonomy"
  | "commerce"
  | "feed"
  | "graph"
  | "geo"
  | "qa"
  | "route"
  | "analytics";

export interface DimensionScore {
  dimension: ReadinessDimension;
  score: number;
  weight: number;
  weightedScore: number;
  checks: ValidationCheck[];
}

export interface PublishValidationResult {
  entity_type: string;
  entity_id: string;
  publish_score: number;
  is_publishable: boolean;
  recommended_state: IndexabilityState;
  recommended_visibility: VisibilityOutputState;
  dimensions: DimensionScore[];
  checks: ValidationCheck[];
  blockers: ValidationCheck[];
  summary: string;
}

export type VisibilityOutputState =
  | "internal_only"
  | "recommendation_only"
  | "itinerary_only"
  | "public_noindex"
  | "public_indexed"
  | "marketplace_active";

// ============ WEIGHT PROFILES ============

type WeightProfile = Record<ReadinessDimension, number>;

const PRODUCT_WEIGHTS: WeightProfile = {
  content: 0.18, media: 0.12, canonical: 0.08, taxonomy: 0.08,
  commerce: 0.14, feed: 0.06, graph: 0.08, geo: 0.06, qa: 0.08,
  route: 0.06, analytics: 0.06,
};

const DESTINATION_WEIGHTS: WeightProfile = {
  content: 0.25, media: 0.15, canonical: 0.10, taxonomy: 0.05,
  commerce: 0.0, feed: 0.0, graph: 0.15, geo: 0.10, qa: 0.05,
  route: 0.10, analytics: 0.05,
};

const HOST_WEIGHTS: WeightProfile = {
  content: 0.30, media: 0.15, canonical: 0.10, taxonomy: 0.05,
  commerce: 0.0, feed: 0.0, graph: 0.15, geo: 0.05, qa: 0.10,
  route: 0.05, analytics: 0.05,
};

const ITINERARY_WEIGHTS: WeightProfile = {
  content: 0.20, media: 0.10, canonical: 0.08, taxonomy: 0.08,
  commerce: 0.05, feed: 0.0, graph: 0.15, geo: 0.05, qa: 0.10,
  route: 0.09, analytics: 0.10,
};

const WEIGHT_PROFILES: Record<string, WeightProfile> = {
  product: PRODUCT_WEIGHTS,
  destination: DESTINATION_WEIGHTS,
  host: HOST_WEIGHTS,
  itinerary: ITINERARY_WEIGHTS,
};

// ============ CHECK HELPER ============

const chk = (
  field: string, rule: string, passed: boolean,
  severity: ValidationCheck["severity"], message: string,
  dimension: ReadinessDimension, weight = 1, suggested_fix?: string,
): ValidationCheck => ({ field, rule, passed, severity, message, dimension, weight, suggested_fix });

// ============ SCORE COMPUTATION ============

const computeDimensionScores = (
  checks: ValidationCheck[],
  weights: WeightProfile,
): { dimensions: DimensionScore[]; overallScore: number } => {
  const groups = new Map<ReadinessDimension, ValidationCheck[]>();
  for (const c of checks) {
    if (!groups.has(c.dimension)) groups.set(c.dimension, []);
    groups.get(c.dimension)!.push(c);
  }

  const dimensions: DimensionScore[] = [];
  for (const [dim, dimChecks] of groups) {
    const totalWeight = dimChecks.reduce((s, c) => s + c.weight, 0);
    const passedWeight = dimChecks.filter(c => c.passed).reduce((s, c) => s + c.weight, 0);
    const dimScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
    const globalWeight = weights[dim] || 0;
    dimensions.push({
      dimension: dim, score: dimScore, weight: globalWeight,
      weightedScore: Math.round(dimScore * globalWeight), checks: dimChecks,
    });
  }

  // Add zero-score dimensions for missing ones
  for (const [dim, w] of Object.entries(weights)) {
    if (w > 0 && !groups.has(dim as ReadinessDimension)) {
      dimensions.push({
        dimension: dim as ReadinessDimension, score: 0, weight: w,
        weightedScore: 0, checks: [],
      });
    }
  }

  const overallScore = dimensions.reduce((s, d) => s + d.weightedScore, 0);
  return { dimensions, overallScore };
};

const determineStates = (
  score: number, blockers: ValidationCheck[], errors: ValidationCheck[],
): { indexability: IndexabilityState; visibility: VisibilityOutputState } => {
  if (blockers.length > 0 || score < 20) {
    return { indexability: "blocked_low_readiness", visibility: "internal_only" };
  }
  if (score < 35) {
    return { indexability: "draft_unpublished", visibility: "recommendation_only" };
  }
  if (score < 50) {
    return { indexability: "draft_unpublished", visibility: "itinerary_only" };
  }
  if (score < 65 || errors.length > 3) {
    return { indexability: "public_noindex", visibility: "public_noindex" };
  }
  if (score < 80) {
    return { indexability: "public_indexed", visibility: "public_indexed" };
  }
  return { indexability: "public_indexed", visibility: "marketplace_active" };
};

// ============ PRODUCT VALIDATION ============

interface ProductValidationContext {
  product: any;
  options?: any[];
  hosts?: any[];
  destination?: any;
  area?: any;
  galleryCount?: number;
  faqCount?: number;
  pairingCount?: number;
  itineraryInclusionCount?: number;
  questionCount?: number;
  duplicateSlugs?: string[];
  hasCanonicalEntry?: boolean;
  hasRouteEntry?: boolean;
  reviewCount?: number;
  saveCount?: number;
  copyCount?: number;
  themeCount?: number;
  semanticProfile?: any;
  positioningProfile?: any;
  intentAffinityCount?: number;
  entityDocCount?: number;
}

export const validateProduct = (ctx: ProductValidationContext): PublishValidationResult => {
  const { product: p, options = [], hosts = [], destination, area } = ctx;
  const checks: ValidationCheck[] = [];

  // === CONTENT ===
  checks.push(chk("title", "non_empty", !!p.title?.trim(), "blocker", p.title ? "Title present" : "Title is required", "content", 2));
  checks.push(chk("title_length", "min_10", (p.title?.length || 0) >= 10, "warning", "Title 10+ chars", "content"));
  checks.push(chk("title_max", "max_80", (p.title?.length || 0) <= 80, "info", "Title under 80 chars for SEO", "content"));
  checks.push(chk("title_uniqueness", "no_duplicate", !(ctx.duplicateSlugs?.length), "error", ctx.duplicateSlugs?.length ? `Duplicate: ${ctx.duplicateSlugs[0]}` : "Slug unique", "content"));
  checks.push(chk("description", "min_50", (p.description?.length || 0) >= 50, "error", "Description 50+ chars", "content", 2, "Add a detailed description"));
  checks.push(chk("description_rich", "min_200", (p.description?.length || 0) >= 200, "warning", "Rich description 200+ chars", "content"));
  checks.push(chk("highlights", "min_3", (p.highlights?.length || 0) >= 3, "warning", "3+ highlights", "content"));
  checks.push(chk("best_for", "has_personas", (p.best_for?.length || 0) >= 1, "info", "Best-for personas", "content"));
  checks.push(chk("duration", "non_empty", !!p.duration, "warning", "Duration specified", "content"));

  // === MEDIA ===
  checks.push(chk("cover_image", "non_empty", !!p.cover_image?.trim(), "blocker", p.cover_image ? "Cover image present" : "Cover image required", "media", 2));
  const gc = ctx.galleryCount ?? (p.gallery?.length || 0);
  checks.push(chk("gallery_3", "min_3", gc >= 3, "warning", `${gc} gallery images (3+)`, "media"));
  checks.push(chk("gallery_6", "min_6", gc >= 6, "info", "6+ for premium", "media"));
  checks.push(chk("video", "has_video", !!p.video_url, "info", "Video improves engagement", "media"));

  // === CANONICAL ===
  checks.push(chk("slug", "non_empty", !!p.slug?.trim(), "blocker", "Slug present", "canonical", 2));
  checks.push(chk("canonical_url", "stored", !!p.canonical_url, "warning", "Canonical URL stored", "canonical"));
  checks.push(chk("indexability_explicit", "has_state", !!p.indexability_state, "warning", "Indexability state explicit", "canonical"));
  checks.push(chk("canonical_registry", "in_registry", !!ctx.hasCanonicalEntry, "error", "Canonical decision registered", "canonical", 1, "Register in page_route_registry"));

  // === TAXONOMY ===
  checks.push(chk("destination", "linked", !!p.destination_id, "blocker", "Destination linked", "taxonomy", 2));
  checks.push(chk("activity_type", "linked", !!p.activity_type_id, "error", "Activity type assigned", "taxonomy"));
  checks.push(chk("area", "linked", !!p.area_id, "info", "Area assignment", "taxonomy"));
  checks.push(chk("themes", "has_themes", (p.themes?.length || 0) >= 1, "info", "Theme tags assigned", "taxonomy"));

  // === COMMERCE ===
  checks.push(chk("options", "min_1", options.length >= 1, "blocker", `${options.length} option(s)`, "commerce", 2));
  const hasPrice = options.some((o: any) => o.price_options?.length > 0);
  checks.push(chk("pricing", "has_price", hasPrice, "error", "Pricing defined", "commerce", 2, "Add at least one price option"));
  checks.push(chk("tier", "has_tier", !!p.tier, "info", "Tier classification", "commerce"));
  checks.push(chk("group_size", "defined", options.some((o: any) => !!o.group_size), "info", "Group size specified", "commerce"));

  // === FEED ===
  checks.push(chk("feed_title", "non_empty", !!p.title, "error", "Title for feed", "feed"));
  checks.push(chk("feed_image", "non_empty", !!p.cover_image, "error", "Image for feed", "feed"));
  checks.push(chk("feed_price", "has_price", hasPrice, "warning", "Pricing for feed", "feed"));
  checks.push(chk("feed_geo", "has_coords", !!(p.latitude && p.longitude), "warning", "Coordinates for feed", "feed"));
  checks.push(chk("feed_description", "min_30", (p.description?.length || 0) >= 30, "warning", "Description 30+ for feed", "feed"));

  // === GRAPH ===
  checks.push(chk("hosts", "min_1", hosts.length >= 1, "error", `${hosts.length} host(s)`, "graph", 2));
  checks.push(chk("host_verified", "verified", hosts.some((h: any) => h.is_verified), "info", "Verified host", "graph"));
  checks.push(chk("pairings", "has_pairings", (ctx.pairingCount || 0) >= 1, "info", "Pairing recommendations", "graph"));
  checks.push(chk("itinerary_inclusion", "included", (ctx.itineraryInclusionCount || 0) >= 1, "info", "In itineraries", "graph"));

  // === GEO ===
  checks.push(chk("coordinates", "has_coords", !!(p.latitude && p.longitude), "warning", "Coordinates set", "geo"));
  checks.push(chk("dest_active", "active", destination?.is_active !== false, "error", "Destination active", "geo"));
  checks.push(chk("area_match", "valid_hierarchy", !p.area_id || (area?.destination_id === p.destination_id), "error", "Area belongs to destination", "geo"));

  // === QA ===
  checks.push(chk("faqs", "min_2", (ctx.faqCount || 0) >= 2, "info", "2+ FAQs", "qa"));
  checks.push(chk("questions", "has_questions", (ctx.questionCount || 0) >= 1, "info", "Community questions", "qa"));
  checks.push(chk("reviews", "has_reviews", (ctx.reviewCount || 0) >= 1, "info", "Has reviews", "qa"));

  // === ROUTE ===
  checks.push(chk("route_registered", "in_registry", !!ctx.hasRouteEntry, "warning", "Route registered in page_route_registry", "route", 1, "Auto-register on save"));
  checks.push(chk("slug_format", "valid_slug", /^[a-z0-9-]+$/.test(p.slug || ""), "error", "Slug format valid", "route"));

  // === ANALYTICS ===
  checks.push(chk("save_count", "has_saves", (ctx.saveCount || 0) >= 1, "info", "Has saves", "analytics"));
  checks.push(chk("copy_count", "has_copies", (ctx.copyCount || 0) >= 1, "info", "Has copies", "analytics"));

  // Compute
  const { dimensions, overallScore } = computeDimensionScores(checks, PRODUCT_WEIGHTS);
  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const errors = checks.filter(c => !c.passed && c.severity === "error");
  const { indexability, visibility } = determineStates(overallScore, blockers, errors);

  return {
    entity_type: "product",
    entity_id: p.id,
    publish_score: overallScore,
    is_publishable: blockers.length === 0 && overallScore >= 35,
    recommended_state: indexability,
    recommended_visibility: visibility,
    dimensions, checks, blockers,
    summary: blockers.length > 0
      ? `${blockers.length} blocker(s) prevent publishing`
      : overallScore >= 70 ? `Ready (score: ${overallScore})` : `Needs work (score: ${overallScore})`,
  };
};

// ============ DESTINATION VALIDATION ============

export const validateDestination = (
  dest: any, productCount: number, areaCount = 0, hasRoute = false,
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];
  checks.push(chk("name", "non_empty", !!dest.name, "blocker", "Name", "content", 2));
  checks.push(chk("slug", "non_empty", !!dest.slug, "blocker", "Slug", "canonical", 2));
  checks.push(chk("description", "min_50", (dest.description?.length || 0) >= 50, "error", "Description", "content", 2));
  checks.push(chk("cover_image", "non_empty", !!dest.cover_image, "error", "Cover image", "media"));
  checks.push(chk("products", "min_5", productCount >= 5, "warning", `${productCount} products`, "graph"));
  checks.push(chk("areas", "min_1", areaCount >= 1, "info", "Has areas", "taxonomy"));
  checks.push(chk("coordinates", "has_coords", !!(dest.latitude && dest.longitude), "warning", "Coordinates", "geo"));
  checks.push(chk("route_entry", "registered", hasRoute, "warning", "Route registered", "route"));
  checks.push(chk("flag", "has_flag", !!dest.flag_emoji, "info", "Flag emoji", "content"));
  checks.push(chk("country", "linked", !!dest.country_id, "warning", "Country linked", "taxonomy"));

  const { dimensions, overallScore } = computeDimensionScores(checks, DESTINATION_WEIGHTS);
  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const errors = checks.filter(c => !c.passed && c.severity === "error");
  const { indexability, visibility } = determineStates(overallScore, blockers, errors);

  return {
    entity_type: "destination", entity_id: dest.id,
    publish_score: overallScore, is_publishable: blockers.length === 0,
    recommended_state: indexability, recommended_visibility: visibility,
    dimensions, checks, blockers, summary: `Score: ${overallScore}`,
  };
};

// ============ HOST VALIDATION ============

export const validateHost = (host: any, productCount = 0): PublishValidationResult => {
  const checks: ValidationCheck[] = [];
  checks.push(chk("display_name", "non_empty", !!host.display_name, "blocker", "Name", "content", 2));
  checks.push(chk("slug", "non_empty", !!host.slug, "blocker", "Slug", "canonical", 2));
  checks.push(chk("bio", "min_20", (host.bio?.length || 0) >= 20, "warning", "Bio", "content"));
  checks.push(chk("avatar", "non_empty", !!host.avatar_url, "info", "Avatar", "media"));
  checks.push(chk("products", "min_1", productCount >= 1, "warning", "Has products", "graph"));
  checks.push(chk("verified", "is_verified", !!host.is_verified, "info", "Verified", "qa"));
  checks.push(chk("destination", "linked", !!host.destination_id, "info", "Home destination", "geo"));

  const { dimensions, overallScore } = computeDimensionScores(checks, HOST_WEIGHTS);
  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const errors = checks.filter(c => !c.passed && c.severity === "error");
  const { indexability, visibility } = determineStates(overallScore, blockers, errors);

  return {
    entity_type: "host", entity_id: host.id,
    publish_score: overallScore, is_publishable: blockers.length === 0,
    recommended_state: indexability, recommended_visibility: visibility,
    dimensions, checks, blockers, summary: `Score: ${overallScore}`,
  };
};

// ============ ITINERARY VALIDATION ============

export const validateItinerary = (
  itin: any, itemCount = 0, hasCreator = false,
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];
  checks.push(chk("title", "non_empty", !!itin.name || !!itin.title, "blocker", "Title", "content", 2));
  checks.push(chk("slug", "non_empty", !!itin.slug, "blocker", "Slug", "canonical", 2));
  checks.push(chk("items", "min_2", itemCount >= 2, "error", `${itemCount} items`, "graph"));
  checks.push(chk("description", "non_empty", !!(itin.description || itin.summary), "warning", "Description", "content"));
  checks.push(chk("creator", "attributed", hasCreator, "warning", "Creator attribution", "graph"));
  checks.push(chk("cover_image", "non_empty", !!itin.cover_image, "info", "Cover image", "media"));
  checks.push(chk("destination", "linked", !!itin.destination_id, "warning", "Destination context", "taxonomy"));

  const { dimensions, overallScore } = computeDimensionScores(checks, ITINERARY_WEIGHTS);
  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const errors = checks.filter(c => !c.passed && c.severity === "error");
  const { indexability, visibility } = determineStates(overallScore, blockers, errors);

  return {
    entity_type: "itinerary", entity_id: itin.id,
    publish_score: overallScore, is_publishable: blockers.length === 0,
    recommended_state: indexability, recommended_visibility: visibility,
    dimensions, checks, blockers, summary: `Score: ${overallScore}`,
  };
};

// ============ PERSIST READINESS SCORES ============

export const persistReadinessScore = async (result: PublishValidationResult): Promise<void> => {
  const dimMap: Record<string, number> = {};
  result.dimensions.forEach(d => { dimMap[d.dimension] = d.score; });

  try {
    await (supabase as any).from("readiness_scores").upsert({
      entity_type: result.entity_type,
      entity_id: result.entity_id,
      content_score: dimMap.content || 0,
      media_score: dimMap.media || 0,
      taxonomy_score: dimMap.taxonomy || 0,
      route_score: dimMap.route || 0,
      canonical_score: dimMap.canonical || 0,
      commerce_score: dimMap.commerce || 0,
      feed_score: dimMap.feed || 0,
      graph_score: dimMap.graph || 0,
      geo_score: dimMap.geo || 0,
      qa_score: dimMap.qa || 0,
      analytics_score: dimMap.analytics || 0,
      overall_score: result.publish_score,
      is_publishable: result.is_publishable,
      recommended_state: result.recommended_state,
      blockers_json: result.blockers.map(b => ({ field: b.field, message: b.message })),
      computed_at: new Date().toISOString(),
    }, { onConflict: "entity_type,entity_id" });
  } catch (err) {
    console.error("Failed to persist readiness score:", err);
  }
};

// ============ PERSIST VALIDATION RESULTS ============

export const persistValidationResults = async (result: PublishValidationResult): Promise<void> => {
  const failedChecks = result.checks.filter(c => !c.passed);
  if (failedChecks.length === 0) return;

  const rows = failedChecks.map(c => ({
    entity_type: result.entity_type,
    entity_id: result.entity_id,
    validator_type: `${c.dimension}/${c.rule}`,
    severity: c.severity,
    blocking_flag: c.severity === "blocker",
    message: c.message,
    suggested_fix: c.suggested_fix || null,
    dimension: c.dimension,
    status: "open",
  }));

  try {
    // Clear old results first
    await (supabase as any).from("validation_results")
      .delete()
      .eq("entity_type", result.entity_type)
      .eq("entity_id", result.entity_id);

    await (supabase as any).from("validation_results").insert(rows);
  } catch (err) {
    console.error("Failed to persist validation results:", err);
  }
};
