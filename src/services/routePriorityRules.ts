/**
 * Route Priority Rules
 * 
 * Determines which page class wins when multiple pages could target
 * the same user intent. Uses deterministic priority order with
 * area_activity, destination_activity subclasses.
 */

import type { PageClass, IndexabilityState, CanonicalDecision } from "./canonicalRegistry";
import { resolveCanonicalPage } from "./canonicalRegistry";

export type { CanonicalDecision };

/**
 * Resolve which page should be the canonical winner for a given intent.
 */
export const resolveIntentCanonical = (
  intent: string,
  candidates: Array<{
    pageType: PageClass;
    entityId: string;
    slug: string;
    destinationSlug?: string;
    indexability: IndexabilityState;
    publishScore: number;
    isActive: boolean;
  }>
): CanonicalDecision => {
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

  // If only one candidate, shortcut
  if (active.length === 1) {
    const c = active[0];
    const { buildCanonicalUrl, indexabilityToRobots } = require("./canonicalRegistry");
    const url = buildCanonicalUrl(c.pageType, { slug: c.slug, destinationSlug: c.destinationSlug });
    const isPublishable = c.publishScore >= 40;
    const finalState = c.indexability === "public_indexed" && isPublishable ? "public_indexed" : "public_noindex";
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

  return resolveCanonicalPage(active);
};
