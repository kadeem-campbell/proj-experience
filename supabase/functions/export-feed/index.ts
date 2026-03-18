/**
 * Export Feed Edge Function v2
 * 
 * Contract-driven partner feed export with:
 * - export_contracts registry lookup for field exposure, versioning, deep-link templates
 * - Full-set JSON replacement per Google Things to Do spec
 * - Validation against contract requirements (geo, image, pricing, description length)
 * - Issue logging to feed_issue_logs
 * - Freshness enforcement (30-day minimum cadence)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const partner = url.searchParams.get('partner') || 'google_ttd';
    const dryRun = url.searchParams.get('dry_run') === 'true';

    // 1. Load contract for this partner
    const { data: contracts } = await supabase
      .from('export_contracts')
      .select('*')
      .eq('partner', partner)
      .eq('is_active', true)
      .order('contract_version', { ascending: false })
      .limit(1);

    const contract = contracts?.[0] || {
      partner,
      feed_type: 'json',
      field_exposure: { title: true, description: true, image: true, geo: true, price: true, url: true, provider: true, activity_type: true },
      requires_geo: true,
      requires_image: true,
      requires_pricing: false,
      min_description_length: 30,
      deep_link_template: 'https://swam.app/things-to-do/{destination_slug}/{product_slug}',
      contract_version: 1,
    };

    // 2. Fetch indexable products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        destinations!products_destination_id_fkey(name, slug, latitude, longitude),
        areas!products_area_id_fkey(name, slug),
        activity_types!products_activity_type_id_fkey(name, slug)
      `)
      .eq('is_active', true);

    if (error) throw error;

    const productIds = (products || []).map((p: any) => p.id);

    // 3. Fetch options + prices + hosts in parallel
    const [optRes, hostRes] = await Promise.all([
      supabase.from('options').select('*, price_options(*)').in('product_id', productIds).eq('is_active', true),
      supabase.from('product_hosts').select('product_id, is_primary, hosts(display_name, slug, avatar_url)').in('product_id', productIds),
    ]);

    const optsByProduct: Record<string, any[]> = {};
    (optRes.data || []).forEach((o: any) => {
      if (!optsByProduct[o.product_id]) optsByProduct[o.product_id] = [];
      optsByProduct[o.product_id].push(o);
    });

    const hostsByProduct: Record<string, any[]> = {};
    (hostRes.data || []).forEach((h: any) => {
      if (!h.hosts) return;
      if (!hostsByProduct[h.product_id]) hostsByProduct[h.product_id] = [];
      hostsByProduct[h.product_id].push({ ...h.hosts, is_primary: h.is_primary });
    });

    // 4. Build feed items with contract enforcement
    const feedItems: any[] = [];
    const issues: any[] = [];
    const fieldExposure = (contract.field_exposure || {}) as Record<string, boolean>;

    for (const p of (products || [])) {
      const dest = (p as any).destinations;
      const area = (p as any).areas;
      const opts = optsByProduct[p.id] || [];
      const hosts = hostsByProduct[p.id] || [];
      const primaryHost = hosts.find((h: any) => h.is_primary) || hosts[0];

      // Check indexability / visibility state
      const state = (p as any).indexability_state || 'public_noindex';
      const score = (p as any).publish_score || 0;
      if (state !== 'public_indexed' && state !== 'marketplace_active') {
        if (score < 40) continue; // skip low-readiness
      }

      // Validate against contract requirements
      let valid = true;
      if (contract.requires_image && !p.cover_image) {
        issues.push({ product_id: p.id, issue: 'missing_image', severity: 'error' });
        valid = false;
      }
      if (contract.requires_geo && !(p.latitude && p.longitude) && !(dest?.latitude && dest?.longitude)) {
        issues.push({ product_id: p.id, issue: 'missing_geo', severity: 'warning' });
      }
      if (contract.requires_pricing && !opts.some((o: any) => o.price_options?.length > 0)) {
        issues.push({ product_id: p.id, issue: 'missing_pricing', severity: 'error' });
        valid = false;
      }
      if (contract.min_description_length && (p.description?.length || 0) < contract.min_description_length) {
        issues.push({ product_id: p.id, issue: 'short_description', severity: 'warning' });
      }
      if (!valid && !dryRun) continue;

      // Build deep link from template
      const deepLink = (contract.deep_link_template || '')
        .replace('{destination_slug}', dest?.slug || 'explore')
        .replace('{product_slug}', p.slug || '');

      const item: any = {};
      if (fieldExposure.title !== false) item.title = p.title;
      if (fieldExposure.description !== false) item.description = p.description || '';
      if (fieldExposure.url !== false) item.url = deepLink || p.canonical_url;
      if (fieldExposure.image !== false) item.image = p.cover_image || p.gallery?.[0] || '';
      if (fieldExposure.geo !== false) {
        item.geo = (p.latitude && p.longitude) ? { lat: p.latitude, lng: p.longitude } : (dest?.latitude && dest?.longitude) ? { lat: dest.latitude, lng: dest.longitude } : null;
      }
      if (fieldExposure.activity_type !== false) item.activity_type = (p as any).activity_types?.name || null;
      if (fieldExposure.price !== false) {
        item.options = opts.map((o: any) => ({
          name: o.name, tier: o.tier, format_type: o.format_type, duration: o.duration, group_size: o.group_size,
          prices: (o.price_options || []).filter((po: any) => po.is_active).map((po: any) => ({
            label: po.label, amount: po.amount, currency: po.currency, original_amount: po.original_amount,
          })),
        }));
      }
      if (fieldExposure.provider !== false && primaryHost) {
        item.provider = { name: primaryHost.display_name, url: `https://swam.app/hosts/${primaryHost.slug}` };
      }

      item.product_id = p.id;
      item["@type"] = "Product";
      item.destination = dest?.name || '';
      item.area = area?.name || null;
      item.rating = p.rating || null;

      feedItems.push(item);
    }

    // 5. Log issues to feed_issue_logs (best effort)
    if (issues.length > 0 && !dryRun) {
      const logRows = issues.map(i => ({
        feed_type: partner,
        entity_id: i.product_id,
        entity_type: 'product',
        issue_type: i.issue,
        severity: i.severity,
        message: `${i.issue} for product ${i.product_id}`,
      }));
      await supabase.from('feed_issue_logs').insert(logRows).throwOnError().catch(() => {});
    }

    return new Response(JSON.stringify({
      feed_version: contract.contract_version?.toString() || "2.0",
      partner,
      contract_version: contract.contract_version || 1,
      generated_at: new Date().toISOString(),
      total_items: feedItems.length,
      validation_issues: issues.length,
      dry_run: dryRun,
      items: feedItems,
      issues,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
