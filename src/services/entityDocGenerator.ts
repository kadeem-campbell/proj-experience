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
  ]);

  const enrichedOptions = (opts || []).map((o: any) => ({
    ...o,
    price_options: o.price_options || [],
  }));

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
  };
};

// ============ GENERATE JSON-LD ============

const generateJsonLd = (e: EnrichedProduct) =>
  generateProductSchema(e.product, e.options, e.hosts, e.destination, e.area);

// ============ GENERATE LLM GROUNDING ============

const generateLlmGrounding = (e: EnrichedProduct) => ({
  entity_type: "product",
  id: e.product.id,
  title: e.product.title,
  slug: e.product.slug,
  description: e.product.description,
  product_family: e.product.product_family,
  destination: e.destination?.name || null,
  area: e.area?.name || null,
  pois: e.pois.map(p => p.name),
  activity_type_id: e.product.activity_type_id,
  themes: e.themes,
  formats: e.formats,
  duration_minutes: e.product.duration_minutes,
  highlights: e.product.highlights_json,
  hosts: e.hosts.map(h => ({ name: h.display_name || h.username, verified: h.is_verified })),
  pricing: e.options.flatMap(o => o.price_options.map(p => ({
    option: o.name,
    category: p.pricing_category,
    amount: p.amount,
    currency: p.currency_code,
  }))),
  semantic_scores: e.semantics,
  intent_affinities: e.intents,
  positioning: e.positioning,
  visibility: e.product.visibility_output_state,
  publish_state: e.product.publish_state,
  canonical_url: e.product.canonical_url || `${BASE}/things-to-do/${e.destination?.slug || "explore"}/${e.product.slug}`,
});

// ============ GENERATE SEARCH DOCUMENT ============

const generateSearchDocument = (e: EnrichedProduct) => ({
  id: e.product.id,
  title: e.product.title,
  slug: e.product.slug,
  description: e.product.description?.slice(0, 500),
  destination: e.destination?.name || null,
  destination_slug: e.destination?.slug || null,
  area: e.area?.name || null,
  product_family: e.product.product_family,
  activity_type_id: e.product.activity_type_id,
  themes: e.themes,
  formats: e.formats,
  duration_minutes: e.product.duration_minutes,
  cover_image: e.product.cover_image_url,
  min_price: Math.min(...e.options.flatMap(o => o.price_options.map(p => p.amount)).filter(Boolean), Infinity),
  currency: e.options[0]?.price_options?.[0]?.currency_code || "USD",
  host_names: e.hosts.map(h => h.display_name || h.username),
  semantic_top: e.semantics
    ? Object.entries(e.semantics).filter(([, v]) => (v as number) >= 0.6).map(([k]) => k.replace("_score", ""))
    : [],
  intent_top: e.intents.filter(i => i.score >= 0.6).map(i => i.name),
  pois: e.pois.map(p => p.name),
  publish_score: e.product.publish_score,
  visibility: e.product.visibility_output_state,
  indexability: e.product.indexability_state,
});

// ============ GENERATE FEED DOCUMENT ============

const generateFeedDocument = (e: EnrichedProduct) => ({
  id: e.product.id,
  title: e.product.title,
  description: e.product.description,
  url: e.product.canonical_url || `${BASE}/things-to-do/${e.destination?.slug || "explore"}/${e.product.slug}`,
  image_url: e.product.cover_image_url,
  destination: e.destination?.name,
  latitude: e.destination?.latitude,
  longitude: e.destination?.longitude,
  duration_minutes: e.product.duration_minutes,
  offers: e.options.flatMap(o => o.price_options.map(p => ({
    name: `${o.name} - ${p.pricing_category}`,
    price: p.amount,
    currency: p.currency_code,
  }))),
  provider: e.hosts[0] ? { name: e.hosts[0].display_name || e.hosts[0].username } : null,
});

// ============ GENERATE PUBLIC PAGE PAYLOAD ============

const generatePublicPagePayload = (e: EnrichedProduct) => ({
  product: {
    id: e.product.id,
    title: e.product.title,
    slug: e.product.slug,
    description: e.product.description,
    product_family: e.product.product_family,
    cover_image_url: e.product.cover_image_url,
    video_url: e.product.video_url,
    gallery: e.product.gallery_json,
    highlights: e.product.highlights_json,
    meeting_points: e.product.meeting_points_json,
    duration_minutes: e.product.duration_minutes,
    seo_title: e.product.seo_title,
    seo_description: e.product.seo_description,
    canonical_url: e.product.canonical_url,
  },
  destination: e.destination ? { id: e.destination.id, name: e.destination.name, slug: e.destination.slug } : null,
  area: e.area ? { id: e.area.id, name: e.area.name, slug: e.area.slug } : null,
  options: e.options.map(o => ({
    id: o.id, name: o.name, slug: o.slug, option_type: o.option_type,
    is_default: o.is_default_option, duration_minutes: o.duration_minutes,
    prices: o.price_options.map(p => ({ category: p.pricing_category, amount: p.amount, currency: p.currency_code })),
  })),
  hosts: e.hosts.map(h => ({ name: h.display_name || h.username, slug: h.slug, avatar: h.avatar_url, verified: h.is_verified })),
  themes: e.themes,
  formats: e.formats,
  pois: e.pois,
  semantics: e.semantics,
  intents: e.intents,
  positioning: e.positioning,
});

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
