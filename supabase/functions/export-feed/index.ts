import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all indexable products with relations
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

    // Fetch options + prices
    const { data: options } = await supabase
      .from('options')
      .select('*, price_options(*)')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('display_order');

    // Fetch hosts
    const { data: hostLinks } = await supabase
      .from('product_hosts')
      .select('product_id, is_primary, hosts(display_name, slug, avatar_url)')
      .in('product_id', productIds);

    // Build lookup maps
    const optsByProduct: Record<string, any[]> = {};
    (options || []).forEach((o: any) => {
      if (!optsByProduct[o.product_id]) optsByProduct[o.product_id] = [];
      optsByProduct[o.product_id].push(o);
    });

    const hostsByProduct: Record<string, any[]> = {};
    (hostLinks || []).forEach((h: any) => {
      if (!h.hosts) return;
      if (!hostsByProduct[h.product_id]) hostsByProduct[h.product_id] = [];
      hostsByProduct[h.product_id].push({ ...h.hosts, is_primary: h.is_primary });
    });

    // Build feed items
    const feedItems = (products || []).map((p: any) => {
      const dest = p.destinations;
      const area = p.areas;
      const opts = optsByProduct[p.id] || [];
      const hosts = hostsByProduct[p.id] || [];
      const primaryHost = hosts.find((h: any) => h.is_primary) || hosts[0];

      return {
        "@type": "Product",
        product_id: p.id,
        title: p.title,
        description: p.description || '',
        url: `https://swam.app/things-to-do/${dest?.slug || 'explore'}/${p.slug}`,
        image: p.cover_image || p.gallery?.[0] || '',
        destination: dest?.name || '',
        area: area?.name || null,
        activity_type: p.activity_types?.name || null,
        geo: (p.latitude && p.longitude) ? { lat: p.latitude, lng: p.longitude } : (dest?.latitude && dest?.longitude) ? { lat: dest.latitude, lng: dest.longitude } : null,
        rating: p.rating || null,
        provider: primaryHost ? {
          name: primaryHost.display_name,
          url: `https://swam.app/hosts/${primaryHost.slug}`,
        } : null,
        options: opts.map((o: any) => ({
          name: o.name,
          tier: o.tier,
          format_type: o.format_type,
          duration: o.duration,
          group_size: o.group_size,
          prices: (o.price_options || []).filter((po: any) => po.is_active).map((po: any) => ({
            label: po.label,
            amount: po.amount,
            currency: po.currency,
            original_amount: po.original_amount,
          })),
        })),
      };
    });

    // Validation summary
    const issues: any[] = [];
    feedItems.forEach((item: any) => {
      if (!item.image) issues.push({ id: item.product_id, issue: 'missing_image' });
      if (!item.description || item.description.length < 30) issues.push({ id: item.product_id, issue: 'short_description' });
      if (item.options.length === 0) issues.push({ id: item.product_id, issue: 'no_options' });
      if (!item.options.some((o: any) => o.prices.length > 0)) issues.push({ id: item.product_id, issue: 'no_pricing' });
      if (!item.geo) issues.push({ id: item.product_id, issue: 'no_coordinates' });
    });

    return new Response(JSON.stringify({
      feed_version: "1.0",
      generated_at: new Date().toISOString(),
      total_items: feedItems.length,
      validation_issues: issues.length,
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
