/**
 * Planner Engine — handles planner sessions, recommendation candidates,
 * itinerary lineage tracking, compare sets, and preference-aware scoring.
 */

import { supabase } from "@/integrations/supabase/client";

// ============ PLANNER SESSIONS ============

export interface PlannerSession {
  id: string;
  session_id: string;
  user_id?: string;
  destination_id?: string;
  area_id?: string;
  context: PlannerContext;
  created_at: string;
}

export interface PlannerContext {
  vibe?: string[];
  pace?: 'relaxed' | 'moderate' | 'packed';
  budget?: 'budget' | 'mid' | 'premium' | 'luxury';
  group_type?: 'solo' | 'couple' | 'family' | 'friends' | 'mixed';
  duration_days?: number;
  interests?: string[];
  avoid?: string[];
}

export const createPlannerSession = async (
  sessionId: string,
  context: PlannerContext,
  userId?: string,
  destinationId?: string,
): Promise<string | null> => {
  try {
    const { data, error } = await (supabase as any).from('planner_sessions').insert({
      session_id: sessionId,
      user_id: userId || null,
      current_destination_id: destinationId || null,
      context_json: context,
    }).select('id').single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error('createPlannerSession failed:', e);
    return null;
  }
};

export const updatePlannerContext = async (
  plannerSessionId: string,
  context: Partial<PlannerContext>,
): Promise<void> => {
  try {
    const { data: existing } = await (supabase as any)
      .from('planner_sessions')
      .select('context_json')
      .eq('id', plannerSessionId)
      .single();

    const merged = { ...(existing?.context_json || {}), ...context };
    await (supabase as any)
      .from('planner_sessions')
      .update({ context_json: merged })
      .eq('id', plannerSessionId);
  } catch (e) {
    console.error('updatePlannerContext failed:', e);
  }
};

// ============ RECOMMENDATION CANDIDATES ============

export interface RecommendationCandidate {
  entity_type: string;
  entity_id: string;
  rank: number;
  score: number;
  reason: string;
  recommendation_type: 'pairing' | 'substitution' | 'persona' | 'trending' | 'similar';
}

export const generateRecommendationSet = async (
  contextJson: Record<string, any>,
  destinationId?: string,
): Promise<RecommendationCandidate[]> => {
  try {
    // Build candidate query based on context
    let query = (supabase as any).from('products')
      .select('id, title, slug, rating, publish_score, activity_type_id, destination_id, area_id')
      .eq('is_active', true)
      .gte('publish_score', 30)
      .order('publish_score', { ascending: false })
      .limit(50);

    if (destinationId) {
      query = query.eq('destination_id', destinationId);
    }

    const { data: products } = await query;
    if (!products?.length) return [];

    // Score candidates based on context
    const vibes = contextJson.vibe || [];
    const budget = contextJson.budget;

    const candidates: RecommendationCandidate[] = (products || []).map((p: any, idx: number) => {
      let score = p.publish_score || 0;

      // Boost based on rating
      if (p.rating) score += p.rating * 5;

      // Budget alignment (simplified heuristic)
      if (budget === 'luxury' && p.tier === 'luxury') score += 15;
      if (budget === 'budget' && p.tier === 'basic') score += 15;

      return {
        entity_type: 'product',
        entity_id: p.id,
        rank: idx + 1,
        score: Math.round(score),
        reason: `Score: ${score} | Rating: ${p.rating || 'N/A'}`,
        recommendation_type: 'similar' as const,
      };
    });

    // Sort by score descending, re-rank
    candidates.sort((a, b) => b.score - a.score);
    candidates.forEach((c, i) => { c.rank = i + 1; });

    return candidates.slice(0, 20);
  } catch (e) {
    console.error('generateRecommendationSet failed:', e);
    return [];
  }
};

// ============ ITINERARY LINEAGE ============

export type LineageRelationship = 'copy' | 'remix' | 'template_generated' | 'ai_generated';

export const recordItineraryLineage = async (
  childItineraryId: string,
  parentItineraryId: string,
  relationship: LineageRelationship,
): Promise<void> => {
  try {
    await (supabase as any).from('itinerary_lineage').insert({
      child_itinerary_id: childItineraryId,
      parent_itinerary_id: parentItineraryId,
      relationship_type: relationship,
    });
  } catch (e) {
    console.error('recordItineraryLineage failed:', e);
  }
};

export const getItineraryLineage = async (itineraryId: string) => {
  try {
    const [{ data: parents }, { data: children }] = await Promise.all([
      (supabase as any).from('itinerary_lineage')
        .select('parent_itinerary_id, relationship_type, created_at')
        .eq('child_itinerary_id', itineraryId),
      (supabase as any).from('itinerary_lineage')
        .select('child_itinerary_id, relationship_type, created_at')
        .eq('parent_itinerary_id', itineraryId),
    ]);
    return { parents: parents || [], children: children || [] };
  } catch {
    return { parents: [], children: [] };
  }
};

// ============ COMPARE SETS ============

export const createCompareSet = async (
  userId: string | null,
  entityType: string,
  entityIds: string[],
  context?: string,
): Promise<string | null> => {
  try {
    const { data, error } = await (supabase as any).from('compare_sets').insert({
      user_id: userId,
      entity_type: entityType,
      entity_ids: entityIds,
      context,
    }).select('id').single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error('createCompareSet failed:', e);
    return null;
  }
};

// ============ PREFERENCE-AWARE SCORING ============

export const scoreForPreferences = (
  product: { tier?: string; format_type?: string; activity_type_id?: string; rating?: number },
  preferences: PlannerContext,
): number => {
  let score = 50; // base

  // Budget alignment
  if (preferences.budget) {
    const budgetTierMap: Record<string, string[]> = {
      budget: ['basic', 'standard'],
      mid: ['standard', 'premium'],
      premium: ['premium', 'luxury'],
      luxury: ['luxury'],
    };
    const matchingTiers = budgetTierMap[preferences.budget] || [];
    if (product.tier && matchingTiers.includes(product.tier)) score += 20;
    else if (product.tier && !matchingTiers.includes(product.tier)) score -= 10;
  }

  // Group type alignment
  if (preferences.group_type === 'solo' && product.format_type === 'self-guided') score += 15;
  if (preferences.group_type === 'couple' && product.format_type === 'private') score += 15;
  if (preferences.group_type === 'family' && product.format_type === 'group') score += 10;

  // Rating boost
  if (product.rating) score += (product.rating - 3) * 10;

  return Math.max(0, Math.min(100, score));
};
