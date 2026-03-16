/**
 * Route Priority Rules
 * 
 * Determines which page class wins when multiple pages could target
 * the same user intent. Uses deterministic priority order.
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

  return resolveCanonicalPage(active);
};
