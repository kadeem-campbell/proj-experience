/**
 * Route Priority Rules
 * 
 * Determines which page class wins when multiple pages could target
 * the same user intent. Uses deterministic priority order.
 */

import type { PageClass, IndexabilityState, CanonicalDecision } from "./canonicalRegistry";
import { buildCanonicalUrl, indexabilityToRobots, resolveCanonicalPage } from "./canonicalRegistry";

export type { CanonicalDecision };

/**
 * Resolve which page should be the canonical winner for a given intent.
 * 
 * Example: if /zanzibar/sunset-cruise could be served by:
 *   - destination+activity page
 *   - area+activity page
 *   - specific product page
 * Then the specific product page wins if publishable and indexable.
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
  // Filter to only active candidates
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

/**
 * Check if a given path matches a legacy URL pattern that needs redirecting.
 */
export const LEGACY_ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  resolve: (match: RegExpMatchArray) => { redirect: string; statusCode: 301 | 410 };
}> = [
  {
    // /experiences/:slug → /things-to-do/:slug
    pattern: /^\/experiences\/(.+)$/,
    resolve: (match) => ({
      redirect: `/things-to-do/${match[1]}`,
      statusCode: 301,
    }),
  },
  {
    // /experiences → /things-to-do
    pattern: /^\/experiences\/?$/,
    resolve: () => ({
      redirect: "/things-to-do",
      statusCode: 301,
    }),
  },
  {
    // /discover → /
    pattern: /^\/discover\/?$/,
    resolve: () => ({
      redirect: "/",
      statusCode: 301,
    }),
  },
];

/**
 * Resolve a legacy route to its canonical successor.
 * Returns null if the path is not a legacy route.
 */
export const resolveLegacyRoute = (
  path: string
): { redirect: string; statusCode: 301 | 410 } | null => {
  for (const rule of LEGACY_ROUTE_PATTERNS) {
    const match = path.match(rule.pattern);
    if (match) {
      return rule.resolve(match);
    }
  }
  return null;
};
