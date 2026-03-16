/**
 * Feed Export Service
 * 
 * Generates Google Things to do feed-ready data and validates feed readiness.
 */

import { supabase } from "@/integrations/supabase/client";

export interface FeedProduct {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  destination: string;
  area?: string;
  activity_type?: string;
  options: FeedOption[];
  host?: { name: string; url: string };
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
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
}

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
    .eq("is_active", true)
    .eq("is_indexable", true);

  if (error || !products) return [];

  const productIds = products.map((p: any) => p.id);

  // Fetch options + prices
  const { data: options } = await supabase
    .from("options")
    .select("*, price_options(*)")
    .in("product_id", productIds)
    .eq("is_active", true);

  // Fetch hosts
  const { data: hostLinks } = await supabase
    .from("product_hosts")
    .select("product_id, hosts(display_name, slug)")
    .in("product_id", productIds);

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
    const area = p.areas;
    const opts = optsByProduct[p.id] || [];
    const host = hostByProduct[p.id];

    return {
      id: p.id,
      title: p.title,
      description: p.description || "",
      url: `https://swam.app/things-to-do/${dest?.slug || "explore"}/${p.slug}`,
      image_url: p.cover_image || "",
      destination: dest?.name || "",
      area: area?.name,
      activity_type: p.activity_types?.name,
      options: opts.map((o: any) => ({
        name: o.name,
        description: o.description || "",
        duration: o.duration,
        format_type: o.format_type || "shared",
        tier: o.tier || "standard",
        prices: (o.price_options || []).map((po: any) => ({
          label: po.label,
          amount: po.amount,
          currency: po.currency,
          original_amount: po.original_amount,
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

// ============ VALIDATE FEED READINESS ============
export const validateFeedReadiness = (products: FeedProduct[]): FeedValidationIssue[] => {
  const issues: FeedValidationIssue[] = [];

  products.forEach((p) => {
    if (!p.title) issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_title", severity: "error", message: "Title is required" });
    if (!p.description || p.description.length < 30) issues.push({ product_id: p.id, product_title: p.title, issue_type: "short_description", severity: "warning", message: "Description should be 30+ chars" });
    if (!p.image_url) issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_image", severity: "error", message: "Cover image required for feed" });
    if (!p.destination) issues.push({ product_id: p.id, product_title: p.title, issue_type: "missing_destination", severity: "error", message: "Destination required" });
    if (p.options.length === 0) issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_options", severity: "warning", message: "No options defined" });
    
    const hasPrice = p.options.some(o => o.prices.length > 0);
    if (!hasPrice) issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_pricing", severity: "warning", message: "No pricing defined" });
    
    if (!p.latitude || !p.longitude) issues.push({ product_id: p.id, product_title: p.title, issue_type: "no_coordinates", severity: "warning", message: "Coordinates improve map/feed quality" });
  });

  return issues;
};

// ============ LOG FEED ISSUES ============
export const logFeedIssues = async (issues: FeedValidationIssue[]): Promise<void> => {
  if (issues.length === 0) return;
  const rows = issues.map(i => ({
    feed_type: "google_ttd",
    entity_type: "product",
    entity_id: i.product_id,
    issue_type: i.issue_type,
    message: i.message,
    severity: i.severity,
    resolved: false,
  }));

  try {
    await (supabase as any).from("feed_issue_logs").insert(rows);
  } catch (err) {
    console.error("Failed to log feed issues:", err);
  }
};
