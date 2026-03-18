/**
 * Route Priority Rules v2
 * 
 * Deterministic priority: product > area_activity > area > destination_activity
 * > destination > curated_collection > itinerary > host > theme > poi > traveler > map_hub
 * 
 * Enhanced with:
 * - Launch profile gating
 * - Visibility output state awareness
 * - Conflict group key detection
 */

import type { PageClass, IndexabilityState, CanonicalDecision } from "./canonicalRegistry";
import { resolveCanonicalPage, buildCanonicalUrl, indexabilityToRobots } from "./canonicalRegistry";

export type { CanonicalDecision };

export interface IntentCandidate {
  pageType: PageClass;
  entityId: string;
  slug: string;
  destinationSlug?: string;
  areaSlug?: string;
  indexability: IndexabilityState;
  publishScore: number;
  isActive: boolean;
  visibilityState?: string;
  conflictGroupKey?: string;
}

/**
 * Resolve which page should be the canonical winner for a given intent.
 */
export const resolveIntentCanonical = (
  intent: string,
  candidates: IntentCandidate[],
): CanonicalDecision => {
  // Filter to active only
  const active = candidates.filter(c => c.isActive);
  
  if (active.length === 0) {
    return {
      winningPageType: "product",
      winningUrl: "",
      robotsDirective: "noindex,nofollow",
      redirectAction: "404",
      indexability: "internal_only",
      sitemapInclude: false,
      losingCandidates: [],
    };
  }

  // Filter by visibility state — internal_only never wins public
  const publishable = active.filter(c => 
    !c.visibilityState || c.visibilityState !== "internal_only"
  );

  const pool = publishable.length > 0 ? publishable : active;

  // If only one candidate, shortcut
  if (pool.length === 1) {
    const c = pool[0];
    const url = buildCanonicalUrl(c.pageType, { slug: c.slug, destinationSlug: c.destinationSlug, areaSlug: c.areaSlug });
    const isPublishable = c.publishScore >= 40;
    const finalState: IndexabilityState = c.indexability === "public_indexed" && isPublishable
      ? "public_indexed" : "public_noindex";
    return {
      winningPageType: c.pageType,
      winningUrl: url,
      robotsDirective: indexabilityToRobots(finalState),
      redirectAction: "none",
      indexability: finalState,
      sitemapInclude: finalState === "public_indexed",
      losingCandidates: [],
    };
  }

  return resolveCanonicalPage(pool);
};

/**
 * Detect conflict groups — entities that could create duplicate pages.
 */
export const detectConflictGroups = (
  candidates: IntentCandidate[],
): Map<string, IntentCandidate[]> => {
  const groups = new Map<string, IntentCandidate[]>();
  
  for (const c of candidates) {
    const key = c.conflictGroupKey || `${c.destinationSlug || '_'}/${c.slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  // Return only groups with actual conflicts (2+ candidates)
  const conflicts = new Map<string, IntentCandidate[]>();
  for (const [key, group] of groups) {
    if (group.length > 1) conflicts.set(key, group);
  }
  return conflicts;
};

/**
 * Check if a product meets launch profile minimum readiness.
 */
export const meetsLaunchThreshold = (
  publishScore: number,
  launchProfile?: { min_product_readiness_to_publish?: number; min_product_readiness_to_index?: number },
  targetState: "publish" | "index" = "publish",
): boolean => {
  if (!launchProfile) return publishScore >= 40;
  const threshold = targetState === "index"
    ? (launchProfile.min_product_readiness_to_index || 70)
    : (launchProfile.min_product_readiness_to_publish || 40);
  return publishScore >= threshold;
};
