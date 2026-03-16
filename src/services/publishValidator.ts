/**
 * Weighted Publish Readiness Engine
 * 
 * Multi-dimensional scoring with separate content, media, canonical, graph,
 * commerce, feed, QA, and confidence dimensions. Thresholded states from
 * blocked_low_readiness up to public_indexed.
 */

import type { Product, ProductOption, Host, Destination, Area } from "@/hooks/useProducts";
import type { IndexabilityState } from "./canonicalRegistry";

export interface ValidationCheck {
  field: string;
  rule: string;
  passed: boolean;
  severity: "blocker" | "error" | "warning" | "info";
  message: string;
  dimension: ReadinessDimension;
  weight: number;
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
  | "qa";

export interface DimensionScore {
  dimension: ReadinessDimension;
  score: number; // 0-100
  weight: number; // 0-1, weights must sum to 1
  weightedScore: number;
  checks: ValidationCheck[];
}

export interface PublishValidationResult {
  entity_type: string;
  entity_id: string;
  publish_score: number; // 0-100 weighted
  is_publishable: boolean;
  recommended_state: IndexabilityState;
  dimensions: DimensionScore[];
  checks: ValidationCheck[];
  blockers: ValidationCheck[];
  summary: string;
}

// Dimension weights for products
const PRODUCT_WEIGHTS: Record<ReadinessDimension, number> = {
  content: 0.20,
  media: 0.15,
  canonical: 0.10,
  taxonomy: 0.10,
  commerce: 0.15,
  feed: 0.05,
  graph: 0.10,
  geo: 0.05,
  qa: 0.10,
};

const check = (
  field: string, rule: string, passed: boolean,
  severity: ValidationCheck["severity"], message: string,
  dimension: ReadinessDimension, weight: number = 1
): ValidationCheck => ({ field, rule, passed, severity, message, dimension, weight });

// ============ PRODUCT VALIDATION ============
export const validateProduct = (
  product: Product,
  options: ProductOption[],
  hosts: Host[],
  destination?: Destination | null,
  extra?: {
    galleryCount?: number;
    faqCount?: number;
    pairingCount?: number;
    itineraryInclusionCount?: number;
    questionCount?: number;
    duplicateSlugs?: string[];
  },
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];
  const e = extra || {};

  // === CONTENT ===
  checks.push(check("title", "non_empty", !!product.title?.trim(), "blocker", product.title ? "Title present" : "Title is required", "content"));
  checks.push(check("title_length", "min_length_10", (product.title?.length || 0) >= 10, "warning", "Title should be 10+ chars", "content"));
  checks.push(check("title_uniqueness", "no_duplicate", !(e.duplicateSlugs?.length), "error", e.duplicateSlugs?.length ? `Duplicate slug found: ${e.duplicateSlugs[0]}` : "Slug is unique", "content"));
  checks.push(check("description", "min_length_50", (product.description?.length || 0) >= 50, "error", "Description should be 50+ chars", "content"));
  checks.push(check("description_quality", "min_length_150", (product.description?.length || 0) >= 150, "warning", "Rich description (150+ chars) improves ranking", "content"));
  checks.push(check("highlights", "min_count_3", (product.highlights?.length || 0) >= 3, "warning", "3+ highlights recommended", "content"));
  checks.push(check("best_for", "has_personas", (product.best_for?.length || 0) >= 1, "info", "Best-for personas improve discovery", "content"));

  // === MEDIA ===
  checks.push(check("cover_image", "non_empty", !!product.cover_image?.trim(), "blocker", product.cover_image ? "Cover image present" : "Cover image is required", "media"));
  const galleryCount = e.galleryCount ?? (product.gallery?.length || 0);
  checks.push(check("gallery", "min_count_3", galleryCount >= 3, "warning", `${galleryCount} gallery images (3+ recommended)`, "media"));
  checks.push(check("gallery_rich", "min_count_6", galleryCount >= 6, "info", "6+ gallery images for premium experience", "media"));
  checks.push(check("video", "has_video", !!product.video_url, "info", "Video improves engagement", "media"));

  // === CANONICAL ===
  checks.push(check("slug", "non_empty", !!product.slug?.trim(), "blocker", product.slug ? "Slug present" : "Slug is required", "canonical"));
  checks.push(check("canonical_url", "has_canonical", !!product.canonical_url, "warning", "Canonical URL should be stored", "canonical"));
  checks.push(check("indexability", "explicit_state", !!(product as any).indexability_state, "warning", "Indexability state should be explicit", "canonical"));

  // === TAXONOMY ===
  checks.push(check("destination", "linked", !!product.destination_id, "blocker", product.destination_id ? "Destination linked" : "Product must be linked to a destination", "taxonomy"));
  checks.push(check("activity_type", "linked", !!product.activity_type_id, "error", product.activity_type_id ? "Activity type linked" : "Activity type should be assigned", "taxonomy"));
  checks.push(check("area", "linked", !!product.area_id, "info", "Area assignment improves location hierarchy", "taxonomy"));

  // === COMMERCE ===
  checks.push(check("options", "min_count_1", options.length >= 1, "blocker", options.length >= 1 ? `${options.length} option(s) defined` : "At least one option is required", "commerce"));
  const hasPrice = options.some(o => o.price_options?.length > 0);
  checks.push(check("pricing", "has_price", hasPrice, "error", hasPrice ? "Pricing defined" : "Pricing is required for feed export", "commerce"));
  const hasDuration = !!product.duration || options.some(o => !!o.duration);
  checks.push(check("duration", "has_duration", hasDuration, "warning", "Duration helps planning", "commerce"));
  checks.push(check("tier", "has_tier", !!product.tier, "info", "Tier classification aids filtering", "commerce"));

  // === FEED ===
  checks.push(check("feed_title", "non_empty", !!product.title, "error", "Title required for feed", "feed"));
  checks.push(check("feed_image", "non_empty", !!product.cover_image, "error", "Image required for feed", "feed"));
  checks.push(check("feed_price", "has_price", hasPrice, "warning", "Pricing improves feed quality", "feed"));
  checks.push(check("feed_geo", "has_coordinates", !!(product.latitude && product.longitude), "warning", "Coordinates required for map feeds", "feed"));

  // === GRAPH ===
  checks.push(check("hosts", "min_count_1", hosts.length >= 1, "error", hosts.length >= 1 ? `${hosts.length} host(s) linked` : "At least one host required", "graph"));
  checks.push(check("pairings", "has_pairings", (e.pairingCount || 0) >= 1, "info", "Pairing recommendations improve engagement", "graph"));
  checks.push(check("itinerary_inclusion", "included", (e.itineraryInclusionCount || 0) >= 1, "info", "Being in itineraries boosts ranking", "graph"));

  // === GEO ===
  checks.push(check("coordinates", "has_coordinates", !!(product.latitude && product.longitude), "warning", "Coordinates improve map visibility", "geo"));
  checks.push(check("destination_valid", "dest_active", destination?.is_active !== false, "error", "Destination must be active", "geo"));

  // === QA ===
  checks.push(check("faqs", "min_count_2", (e.faqCount || 0) >= 2, "info", "2+ FAQs improve conversion", "qa"));
  checks.push(check("questions", "has_questions", (e.questionCount || 0) >= 1, "info", "Community questions improve content", "qa"));

  // Compute dimension scores
  const dimensionGroups = new Map<ReadinessDimension, ValidationCheck[]>();
  for (const c of checks) {
    if (!dimensionGroups.has(c.dimension)) dimensionGroups.set(c.dimension, []);
    dimensionGroups.get(c.dimension)!.push(c);
  }

  const dimensions: DimensionScore[] = [];
  for (const [dim, dimChecks] of dimensionGroups) {
    const totalWeight = dimChecks.reduce((s, c) => s + c.weight, 0);
    const passedWeight = dimChecks.filter(c => c.passed).reduce((s, c) => s + c.weight, 0);
    const dimScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
    const globalWeight = PRODUCT_WEIGHTS[dim] || 0.05;
    dimensions.push({
      dimension: dim,
      score: dimScore,
      weight: globalWeight,
      weightedScore: Math.round(dimScore * globalWeight),
      checks: dimChecks,
    });
  }

  const publishScore = dimensions.reduce((s, d) => s + d.weightedScore, 0);
  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const errors = checks.filter(c => !c.passed && c.severity === "error");

  // Determine recommended state
  let recommended_state: IndexabilityState;
  if (blockers.length > 0) {
    recommended_state = "blocked_low_readiness";
  } else if (publishScore < 30) {
    recommended_state = "blocked_low_readiness";
  } else if (publishScore < 50) {
    recommended_state = "draft_unpublished";
  } else if (publishScore < 70 || errors.length > 2) {
    recommended_state = "public_noindex";
  } else {
    recommended_state = "public_indexed";
  }

  const summary = blockers.length > 0
    ? `${blockers.length} blocker(s) prevent publishing`
    : publishScore >= 70
      ? `Ready to publish (score: ${publishScore})`
      : `Needs improvement (score: ${publishScore})`;

  return {
    entity_type: "product",
    entity_id: product.id,
    publish_score: publishScore,
    is_publishable: blockers.length === 0 && publishScore >= 40,
    recommended_state,
    dimensions,
    checks,
    blockers,
    summary,
  };
};

// ============ DESTINATION VALIDATION ============
export const validateDestination = (
  destination: Destination,
  productCount: number,
  areaCount?: number,
): PublishValidationResult => {
  const checks: ValidationCheck[] = [];

  checks.push(check("name", "non_empty", !!destination.name, "blocker", "Name required", "content"));
  checks.push(check("slug", "non_empty", !!destination.slug, "blocker", "Slug required", "canonical"));
  checks.push(check("description", "min_length_50", (destination.description?.length || 0) >= 50, "error", "Description check", "content"));
  checks.push(check("cover_image", "non_empty", !!destination.cover_image, "error", "Cover image check", "media"));
  checks.push(check("products", "min_count_5", productCount >= 5, "warning", `${productCount} products (5+ for hub)`, "graph"));
  checks.push(check("areas", "min_count_1", (areaCount || 0) >= 1, "info", "Areas improve destination structure", "taxonomy"));
  checks.push(check("coordinates", "has_coordinates", !!(destination.latitude && destination.longitude), "warning", "Coordinates improve maps", "geo"));

  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const passed = checks.filter(c => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    entity_type: "destination",
    entity_id: destination.id,
    publish_score: score,
    is_publishable: blockers.length === 0,
    recommended_state: blockers.length > 0 ? "blocked_low_readiness" : score >= 70 ? "public_indexed" : "public_noindex",
    dimensions: [],
    checks,
    blockers,
    summary: blockers.length > 0 ? `${blockers.length} blocker(s)` : `Score: ${score}`,
  };
};

// ============ HOST VALIDATION ============
export const validateHost = (host: Host): PublishValidationResult => {
  const checks: ValidationCheck[] = [];

  checks.push(check("display_name", "non_empty", !!host.display_name, "blocker", "Display name check", "content"));
  checks.push(check("slug", "non_empty", !!host.slug, "blocker", "Slug check", "canonical"));
  checks.push(check("bio", "min_length_20", (host.bio?.length || 0) >= 20, "warning", "Bio check", "content"));
  checks.push(check("avatar", "non_empty", !!host.avatar_url, "info", "Avatar check", "media"));

  const blockers = checks.filter(c => !c.passed && c.severity === "blocker");
  const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

  return {
    entity_type: "host",
    entity_id: host.id,
    publish_score: score,
    is_publishable: blockers.length === 0,
    recommended_state: blockers.length > 0 ? "blocked_low_readiness" : score >= 70 ? "public_indexed" : "public_noindex",
    dimensions: [],
    checks,
    blockers,
    summary: `Score: ${score}`,
  };
};
