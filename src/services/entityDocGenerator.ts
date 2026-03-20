/**
 * Entity Document Generation Service
 * 
 * Generates all 5 document types for products:
 * - json_ld: Google-readable structured data
 * - llm_grounding: facts for AI consumption
 * - search_document: internal search index payload
 * - feed_document: partner feed payload
 * - public_page_payload: SSR/page rendering data
 */

import { supabase } from "@/integrations/supabase/client";
import { generateProductSchema } from "./schemaGenerator";
import type { Product, ProductOption, Destination, Area, Host } from "@/hooks/useProducts";

const BASE = "https://swam.app";

interface EnrichedProduct {
  product: Product;
  destination: Destination | null;
  area: Area | null;
  options: ProductOption[];
  hosts: Host[];
  themes: string[];
  formats: string[];
  semantics: Record<string, number> | null;
  intents: { name: string; score: number }[];
  positioning: Record<string, number> | null;
  pois: { name: string; slug: string }[];
  inclusions: { name: string; emoji: string; category: string }[];
  transport: { name: string; emoji: string; description: string }[];
  timing: any | null;
}

// ============ FETCH ENRICHMENT ============

const fetchEnrichment = async (productId: string): Promise<EnrichedProduct | null> => {
  const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
  if (!product) return null;

  const [
    { data: dest },
    { data: area },
    { data: opts },
    { data: hostLinks },
    { data: themeLinks },
    { data: formatLinks },
    { data: sem },
    { data: intentLinks },
    { data: pos },
    { data: poiLinks },
    { data: inclusionLinks },
    { data: transportLinks },
    { data: timingProfiles },
  ] = await Promise.all([
    product.destination_id
      ? supabase.from("destinations").select("*").eq("id", product.destination_id).maybeSingle()
      : Promise.resolve({ data: null }),
    (product as any).primary_area_id || (product as any).area_id
      ? supabase.from("areas").select("*").eq("id", (product as any).primary_area_id || (product as any).area_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("options").select("*, price_options(*)").eq("product_id", productId).eq("is_active", true) as any,
    supabase.from("product_hosts").select("*, hosts(*)").eq("product_id", productId) as any,
    supabase.from("product_themes").select("*, themes(name)").eq("product_id", productId) as any,
    supabase.from("product_formats").select("format_type").eq("product_id", productId) as any,
    supabase.from("semantic_product_profiles").select("*").eq("product_id", productId).maybeSingle() as any,
    supabase.from("product_intent_affinities").select("*, traveller_intent_profiles(name)").eq("product_id", productId) as any,
    supabase.from("product_positioning_profiles").select("*").eq("product_id", productId).maybeSingle() as any,
    supabase.from("product_pois").select("*, pois(name, slug)").eq("product_id", productId) as any,
    supabase.from("product_inclusions").select("*, inclusion_items(name, emoji, category)").eq("product_id", productId).order("display_order") as any,
    supabase.from("product_transport").select("*, transport_modes(name, emoji)").eq("product_id", productId).order("display_order") as any,
    supabase.from("product_timing_profiles").select("*").eq("product_id", productId).eq("is_active", true).order("profile_type") as any,
  ]);

  const enrichedOptions = (opts || []).map((o: any) => ({
    ...o,
    price_options: o.price_options || [],
  }));

  // Resolve active timing profile
  const defaultTiming = (timingProfiles || []).find((t: any) => t.profile_type === 'default') || (timingProfiles || [])[0] || null;

  return {
    product: product as unknown as Product,
    destination: dest as unknown as Destination | null,
    area: area as unknown as Area | null,
    options: enrichedOptions,
    hosts: (hostLinks || []).map((h: any) => h.hosts).filter(Boolean) as Host[],
    themes: (themeLinks || []).map((t: any) => t.themes?.name).filter(Boolean),
    formats: (formatLinks || []).map((f: any) => f.format_type).filter(Boolean),
    semantics: sem ? (() => { const { product_id, updated_at, ...scores } = sem; return scores; })() : null,
    intents: (intentLinks || []).map((i: any) => ({
      name: i.traveller_intent_profiles?.name || "",
      score: i.affinity_score,
    })).filter((i: any) => i.name),
    positioning: pos ? (() => { const { product_id, updated_at, ...scores } = pos; return scores; })() : null,
    pois: (poiLinks || []).map((p: any) => p.pois).filter(Boolean),
    inclusions: (inclusionLinks || []).map((i: any) => ({
      name: i.inclusion_items?.name || '',
      emoji: i.inclusion_items?.emoji || '',
      category: i.inclusion_items?.category || '',
    })).filter((i: any) => i.name),
    transport: (transportLinks || []).map((t: any) => ({
      name: t.transport_modes?.name || '',
      emoji: t.transport_modes?.emoji || '',
      description: t.description || '',
    })).filter((t: any) => t.name),
    timing: defaultTiming,
  };
};

// ============ TIMING HELPERS ============

import { resolveTimingProfile, deriveTimingDisplay as deriveTiming } from "@/lib/timing";
import type { TimingProfileRecord } from "@/lib/timing";

const deriveTimingDisplay = (timing: any) => {
  if (!timing) return null;
  // Use the canonical engine from timing.ts
  const display = deriveTiming(timing as TimingProfileRecord);
  return display;
};

// ============ GENERATE JSON-LD ============

const generateJsonLd = (e: EnrichedProduct) =>
  generateProductSchema(e.product, e.options, e.hosts, e.destination, e.area);

// ============ GENERATE LLM GROUNDING ============

const generateLlmGrounding = (e: EnrichedProduct) => {
  const p = e.product as any;
  const areaSlug = e.area?.slug;
  const canonicalUrl = p.canonical_url || `${BASE}/things-to-do/${e.destination?.slug || "explore"}${areaSlug ? `/${areaSlug}` : ''}/${p.slug}`;

  return {
    entity_type: "product",
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    product_family: p.product_family,
    destination: e.destination?.name || null,
    area: e.area?.name || null,
    pois: e.pois.map(poi => poi.name),
    activity_type_id: p.activity_type_id,
    themes: e.themes,
    formats: e.formats,
    duration_minutes: p.duration_minutes,
    highlights: p.highlights_json,
    meeting_points: p.meeting_points_json,
    local_tips: p.local_tips_json,
    getting_there: p.getting_there_description,
    inclusions: e.inclusions.map(i => i.name),
    transport_modes: e.transport.map(t => ({ mode: t.name, description: t.description })),
    hosts: e.hosts.map(h => ({ name: h.display_name || h.username, verified: h.is_verified })),
    pricing: e.options.flatMap(o => o.price_options.map(pr => ({
      option: o.name,
      category: pr.pricing_category,
      amount: pr.amount,
      amount_max: (pr as any).amount_max || null,
      currency: pr.currency_code,
    }))),
    average_price_per_person: p.average_price_per_person,
    semantic_scores: e.semantics,
    intent_affinities: e.intents,
    positioning: e.positioning,
    timing: e.timing ? {
      timezone: e.timing.local_timezone,
      peak_window: { start: e.timing.peak_start_hour, end: e.timing.peak_end_hour },
      secondary_window: e.timing.secondary_start_hour != null ? { start: e.timing.secondary_start_hour, end: e.timing.secondary_end_hour } : null,
      confidence: e.timing.confidence_score,
      flexibility: e.timing.flexibility_level,
      reason_tags: e.timing.reason_tags,
      note: e.timing.timing_note,
      hourly_scores: e.timing.hourly_scores,
      display: deriveTimingDisplay(e.timing),
    } : null,
    visibility: p.visibility_output_state,
    publish_state: p.publish_state,
    canonical_url: canonicalUrl,
  };
};

// ============ GENERATE SEARCH DOCUMENT ============

const generateSearchDocument = (e: EnrichedProduct) => {
  const p = e.product as any;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description?.slice(0, 500),
    destination: e.destination?.name || null,
    destination_slug: e.destination?.slug || null,
    area: e.area?.name || null,
    area_slug: e.area?.slug || null,
    product_family: p.product_family,
    activity_type_id: p.activity_type_id,
    themes: e.themes,
    formats: e.formats,
    duration_minutes: p.duration_minutes,
    cover_image: p.cover_image_url,
    min_price: Math.min(...e.options.flatMap(o => o.price_options.map(pr => pr.amount)).filter(Boolean), Infinity),
    average_price: p.average_price_per_person,
    currency: e.options[0]?.price_options?.[0]?.currency_code || "USD",
    host_names: e.hosts.map(h => h.display_name || h.username),
    inclusions: e.inclusions.map(i => i.name),
    semantic_top: e.semantics
      ? Object.entries(e.semantics).filter(([, v]) => (v as number) >= 0.6).map(([k]) => k.replace("_score", ""))
      : [],
    intent_top: e.intents.filter(i => i.score >= 0.6).map(i => i.name),
    pois: e.pois.map(poi => poi.name),
    timing_label: deriveTimingDisplay(e.timing)?.primary_time_label || null,
    publish_score: p.publish_score,
    visibility: p.visibility_output_state,
    indexability: p.indexability_state,
  };
};

// ============ GENERATE FEED DOCUMENT ============

const generateFeedDocument = (e: EnrichedProduct) => {
  const p = e.product as any;
  const areaSlug = e.area?.slug;
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.canonical_url || `${BASE}/things-to-do/${e.destination?.slug || "explore"}${areaSlug ? `/${areaSlug}` : ''}/${p.slug}`,
    image_url: p.cover_image_url,
    destination: e.destination?.name,
    latitude: e.destination?.latitude,
    longitude: e.destination?.longitude,
    duration_minutes: p.duration_minutes,
    offers: e.options.flatMap(o => o.price_options.map(pr => ({
      name: `${o.name} - ${pr.pricing_category}`,
      price: pr.amount,
      price_max: (pr as any).amount_max || null,
      currency: pr.currency_code,
    }))),
    inclusions: e.inclusions.map(i => i.name),
    provider: e.hosts[0] ? { name: e.hosts[0].display_name || e.hosts[0].username } : null,
  };
};

// ============ GENERATE PUBLIC PAGE PAYLOAD ============

const generatePublicPagePayload = (e: EnrichedProduct) => {
  const p = e.product as any;
  return {
    product: {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      product_family: p.product_family,
      cover_image_url: p.cover_image_url,
      video_url: p.video_url,
      gallery: p.gallery_json,
      highlights: p.highlights_json,
      meeting_points: p.meeting_points_json,
      local_tips: p.local_tips_json,
      getting_there_description: p.getting_there_description,
      duration_minutes: p.duration_minutes,
      average_price_per_person: p.average_price_per_person,
      tiktok_url: p.tiktok_url,
      instagram_url: p.instagram_url,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      canonical_url: p.canonical_url,
    },
    destination: e.destination ? { id: e.destination.id, name: e.destination.name, slug: e.destination.slug } : null,
    area: e.area ? { id: e.area.id, name: e.area.name, slug: e.area.slug } : null,
    options: e.options.map(o => ({
      id: o.id, name: o.name, slug: o.slug, option_type: o.option_type,
      is_default: o.is_default_option, duration_minutes: o.duration_minutes,
      prices: o.price_options.map(pr => ({ category: pr.pricing_category, amount: pr.amount, amount_max: (pr as any).amount_max, currency: pr.currency_code })),
    })),
    hosts: e.hosts.map(h => ({ name: h.display_name || h.username, slug: h.slug, avatar: h.avatar_url, verified: h.is_verified })),
    inclusions: e.inclusions,
    transport: e.transport,
    themes: e.themes,
    formats: e.formats,
    pois: e.pois,
    semantics: e.semantics,
    intents: e.intents,
    positioning: e.positioning,
    timing: e.timing ? {
      timezone: e.timing.local_timezone,
      peak_window: { start: e.timing.peak_start_hour, end: e.timing.peak_end_hour },
      confidence: e.timing.confidence_score,
      flexibility: e.timing.flexibility_level,
      display: deriveTimingDisplay(e.timing),
    } : null,
  };
};

// ============ HASH ============

const hashObj = (obj: any): string => {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(36);
};

// ============ GENERATE ALL DOCS ============

export const generateEntityDocuments = async (productId: string): Promise<boolean> => {
  const enriched = await fetchEnrichment(productId);
  if (!enriched) return false;

  const generators: Record<string, (e: EnrichedProduct) => any> = {
    json_ld: generateJsonLd,
    llm_grounding: generateLlmGrounding,
    search_document: generateSearchDocument,
    feed_document: generateFeedDocument,
    public_page_payload: generatePublicPagePayload,
  };

  for (const [docType, gen] of Object.entries(generators)) {
    const doc = gen(enriched);
    const sourceHash = hashObj(doc);

    // Check if content changed
    const { data: existing } = await supabase
      .from("entity_documents")
      .select("source_hash, version")
      .eq("entity_type", "product")
      .eq("entity_id", productId)
      .eq("document_type", docType)
      .maybeSingle() as any;

    if (existing?.source_hash === sourceHash) continue;

    await (supabase as any).from("entity_documents").upsert({
      entity_type: "product",
      entity_id: productId,
      document_type: docType,
      document_json: doc,
      version: (existing?.version || 0) + 1,
      generated_at: new Date().toISOString(),
      generation_status: "complete",
      source_hash: sourceHash,
    }, { onConflict: "entity_type,entity_id,document_type" });
  }

  return true;
};

// ============ BULK GENERATE ============

export const bulkGenerateEntityDocuments = async (productIds: string[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  for (const id of productIds) {
    const ok = await generateEntityDocuments(id);
    if (ok) success++; else failed++;
  }
  return { success, failed };
};
