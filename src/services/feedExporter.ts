/**
 * Feed Export Service v2 with Contract Registry,
 * Partner Abstractions, Deep-Link Enforcement, and Freshness Rules
 */

import { supabase } from "@/integrations/supabase/client";

// ============ TYPES ============

export interface ExportContract {
  id: string;
  partner: string;
  feed_type: string;
  contract_version: number;
  field_exposure: Record<string, boolean>;
  deep_link_template: string;
  is_active: boolean;
  requires_pricing: boolean;
  requires_geo: boolean;
  requires_image: boolean;
  min_description_length: number;
}

export interface FeedProduct {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  destination: string;
  destination_slug: string;
  area?: string;
  activity_type?: string;
  options: FeedOption[];
  host?: { name: string; url: string };
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
  visibility_output_state?: string;
  publish_score?: number;
}

export interface FeedOption {
  name: string;
  description: string;
  duration?: string;
  format_type: string;
  tier: string;
  prices: FeedPrice[];
}

export interface FeedPrice {
  label: string;
  amount: number;
  currency: string;
  original_amount?: number;
}

export interface FeedValidationIssue {
  product_id: string;
  product_title: string;
  issue_type: string;
  severity: "error" | "warning";
  message: string;
  contract_rule?: string;
}

export interface PartnerExportResult {
  export_id?: string;
  partner: string;
  total_products: number;
  eligible_products: number;
  excluded_products: number;
  validation_issues: FeedValidationIssue[];
  freshness_ok: boolean;
  days_since_last_export: number | null;
}

// ============ FETCH CONTRACTS ============

export const fetchExportContracts = async (): Promise<ExportContract[]> => {
  const { data, error } = await (supabase as any)
    .from("export_contracts")
    .select("*")
    .eq("is_active", true);
  return error ? [] : (data || []);
};

// ============ FETCH FEED DATA ============

export const fetchFeedProducts = async (): Promise<FeedProduct[]> => {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      destinations!products_destination_id_fkey(name, slug),
      areas!products_area_id_fkey(name, slug),
      activity_types!products_activity_type_id_fkey(name, slug)
    `)
    .eq("is_active", true);

  if (error || !products) return [];

  const productIds = products.map((p: any) => p.id);
  if (productIds.length === 0) return [];

  const [{ data: options }, { data: hostLinks }] = await Promise.all([
    supabase.from("options").select("*, price_options(*)").in("product_id", productIds).eq("is_active", true),
    supabase.from("product_hosts").select("product_id, hosts(display_name, slug)").in("product_id", productIds),
  ]);

  const optsByProduct: Record<string, any[]> = {};
  (options || []).forEach((o: any) => {
    if (!optsByProduct[o.product_id]) optsByProduct[o.product_id] = [];
    optsByProduct[o.product_id].push(o);
  });

  const hostByProduct: Record<string, any> = {};
  (hostLinks || []).forEach((h: any) => {
    if (h.hosts) hostByProduct[h.product_id] = h.hosts;
  });

  return products.map((p: any) => {
    const dest = p.destinations;
    const opts = optsByProduct[p.id] || [];
    const host = hostByProduct[p.id];

    return {
      id: p.id,
      title: p.title,
      description: p.description || "",
      url: `https://swam.app/things-to-do/${dest?.slug || "explore"}/${p.slug}`,
      image_url: p.cover_image || "",
      destination: dest?.name || "",
      destination_slug: dest?.slug || "explore",
      area: p.areas?.name,
      activity_type: p.activity_types?.name,
      visibility_output_state: p.visibility_output_state,
      publish_score: p.publish_score,
      options: opts.map((o: any) => ({
        name: o.name, description: o.description || "",
        duration: o.duration, format_type: o.format_type || "shared",
        tier: o.tier || "standard",
        prices: (o.price_options || []).map((po: any) => ({
          label: po.label, amount: po.amount,
          currency: po.currency, original_amount: po.original_amount,
        })),
      })),
      host: host ? { name: host.display_name, url: `https://swam.app/hosts/${host.slug}` } : undefined,
      rating: p.rating,
      review_count: p.view_count,
      latitude: p.latitude,
      longitude: p.longitude,
    };
  });
};

// ============ FILTER BY VISIBILITY STATE ============

export const filterFeedEligible = (products: FeedProduct[]): { eligible: FeedProduct[]; excluded: FeedProduct[] } => {
  const eligibleStates = ["public_indexed", "marketplace_active"];
  const eligible = products.filter(p =>
    eligibleStates.includes(p.visibility_output_state || "") ||
    (p.publish_score || 0) >= 40
  );
  const excluded = products.filter(p => !eligible.includes(p));
  return { eligible, excluded };
};

// ============ VALIDATE AGAINST CONTRACT ============

export const validateFeedAgainstContract = (
  products: FeedProduct[], contract: ExportContract,
): FeedValidationIssue[] => {
  const issues: FeedValidationIssue[] = [];

  products.forEach((p) => {
    if (!p.title) issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_title", severity: "error", message: "Title required", contract_rule: "core" });
    
    if (contract.requires_image && !p.image_url) {
      issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_image", severity: "error", message: `Image required by ${contract.partner}`, contract_rule: "requires_image" });
    }

    if (contract.min_description_length && (!p.description || p.description.length < contract.min_description_length)) {
      issues.push({ product_id: p.id, product_title: p.title, issue_type: "short_description", severity: "warning", message: `Description < ${contract.min_description_length} chars`, contract_rule: "min_description_length" });
    }

    if (contract.requires_pricing) {
      const hasPrice = p.options.some(o => o.prices.length > 0);
      if (!hasPrice) issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_pricing", severity: "error", message: `Pricing required by ${contract.partner}`, contract_rule: "requires_pricing" });
    }

    if (contract.requires_geo && (!p.latitude || !p.longitude)) {
      issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_coordinates", severity: "error", message: `Coordinates required by ${contract.partner}`, contract_rule: "requires_geo" });
    }

    // Deep-link enforcement
    if (contract.deep_link_template) {
      const expectedUrl = contract.deep_link_template
        .replace("{destination_slug}", p.destination_slug)
        .replace("{product_slug}", p.url.split("/").pop() || "");
      if (p.url !== expectedUrl) {
        issues.push({ product_id: p.id, product_title: p.title, issue_type: "deep_link_mismatch", severity: "warning", message: `URL mismatch: expected ${expectedUrl}`, contract_rule: "deep_link_template" });
      }
    }

    if (!p.destination) issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_destination", severity: "error", message: "Destination required", contract_rule: "core" });
    if (p.options.length === 0) issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_options", severity: "warning", message: "No options defined", contract_rule: "core" });
  });

  return issues;
};

// ============ CHECK FRESHNESS ============

export const checkExportFreshness = async (partnerKey: string): Promise<{ ok: boolean; daysSince: number | null }> => {
  const { data } = await (supabase as any)
    .from("partner_exports")
    .select("finished_at")
    .eq("partner_key", partnerKey)
    .eq("status", "completed")
    .order("finished_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return { ok: false, daysSince: null };

  const lastExport = new Date(data[0].finished_at);
  const daysSince = Math.floor((Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24));
  return { ok: daysSince <= 30, daysSince };
};

// ============ RUN FULL EXPORT ============

export const runPartnerExport = async (contract: ExportContract): Promise<PartnerExportResult> => {
  const allProducts = await fetchFeedProducts();
  const { eligible, excluded } = filterFeedEligible(allProducts);
  const issues = validateFeedAgainstContract(eligible, contract);
  const freshness = await checkExportFreshness(contract.partner);

  // Record export job
  const { data: exportJob } = await (supabase as any).from("partner_exports").insert({
    partner_key: contract.partner,
    export_type: contract.feed_type,
    status: issues.filter(i => i.severity === "error").length > 0 ? "failed" : "completed",
    record_count: eligible.length,
    error_json: issues.filter(i => i.severity === "error"),
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  }).select("id").single();

  // Record per-product rows
  if (exportJob?.id) {
    const rows = eligible.map(p => ({
      export_id: exportJob.id,
      product_id: p.id,
      payload_json: applyFieldExposure([p], contract)[0] || {},
      validation_errors_json: issues.filter(i => i.product_id === p.id),
    }));
    if (rows.length > 0) {
      await (supabase as any).from("partner_export_rows").insert(rows);
    }
  }

  return {
    export_id: exportJob?.id,
    partner: contract.partner,
    total_products: allProducts.length,
    eligible_products: eligible.length,
    excluded_products: excluded.length,
    validation_issues: issues,
    freshness_ok: freshness.ok,
    days_since_last_export: freshness.daysSince,
  };
};

// ============ APPLY FIELD EXPOSURE ============

export const applyFieldExposure = (products: FeedProduct[], contract: ExportContract): any[] => {
  const exposure = contract.field_exposure || {};
  return products.map(p => {
    const item: Record<string, any> = { id: p.id, title: p.title, url: p.url };
    if (exposure.description !== false) item.description = p.description;
    if (exposure.image !== false) item.image_url = p.image_url;
    if (exposure.destination !== false) item.destination = p.destination;
    if (exposure.area !== false) item.area = p.area;
    if (exposure.activity_type !== false) item.activity_type = p.activity_type;
    if (exposure.options !== false) item.options = p.options;
    if (exposure.host !== false) item.host = p.host;
    if (exposure.rating !== false) item.rating = p.rating;
    if (exposure.geo !== false && p.latitude) item.geo = { lat: p.latitude, lng: p.longitude };
    return item;
  });
};

// ============ LOG FEED ISSUES ============

export const logFeedIssues = async (issues: FeedValidationIssue[]): Promise<void> => {
  if (issues.length === 0) return;
  const rows = issues.map(i => ({
    feed_type: "google_ttd",
    entity_type: "product",
    entity_id: i.product_id,
    issue_type: i.issue_type,
    message: `[${i.contract_rule || 'core'}] ${i.message}`,
    severity: i.severity,
    resolved: false,
  }));

  try {
    await (supabase as any).from("feed_issue_logs").insert(rows);
  } catch (err) {
    console.error("Failed to log feed issues:", err);
  }
};

// Legacy compat
export const validateFeedReadiness = (products: FeedProduct[]) =>
  validateFeedAgainstContract(products, {
    id: "default", partner: "internal", feed_type: "generic",
    contract_version: 1, field_exposure: {},
    deep_link_template: "https://swam.app/things-to-do/{destination_slug}/{product_slug}",
    is_active: true, requires_pricing: true, requires_geo: false,
    requires_image: true, min_description_length: 30,
  });
