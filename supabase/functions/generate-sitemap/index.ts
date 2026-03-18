/**
 * Generate Sitemap Edge Function v2
 * 
 * Produces class-based XML sitemap index with sub-sitemaps for:
 * static, destinations, areas, products, itineraries, hosts, collections, pois
 * 
 * Filters by indexability_state = 'public_indexed' and readiness scores.
 * Includes image extensions per Google spec.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = 'https://swam.app';
    const now = new Date().toISOString().split('T')[0];

    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'index';

    if (sitemapType === 'index') {
      const types = ['static', 'destinations', 'areas', 'products', 'itineraries', 'hosts', 'collections', 'pois'];
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${types.map(t => `  <sitemap><loc>${baseUrl}/sitemap.xml?type=${t}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;
      return new Response(sitemapIndex, { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } });
    }

    const urls: { loc: string; lastmod: string; priority: string; changefreq: string; images?: string[] }[] = [];

    if (sitemapType === 'static') {
      urls.push({ loc: `${baseUrl}/`, lastmod: now, priority: '1.0', changefreq: 'daily' });
      urls.push({ loc: `${baseUrl}/things-to-do`, lastmod: now, priority: '0.9', changefreq: 'daily' });
      urls.push({ loc: `${baseUrl}/itineraries`, lastmod: now, priority: '0.8', changefreq: 'weekly' });
      urls.push({ loc: `${baseUrl}/hosts`, lastmod: now, priority: '0.7', changefreq: 'weekly' });
      urls.push({ loc: `${baseUrl}/about`, lastmod: now, priority: '0.4', changefreq: 'monthly' });
    }

    if (sitemapType === 'destinations') {
      const { data: dests } = await supabase.from('destinations')
        .select('slug, updated_at, cover_image, indexability_state')
        .eq('is_active', true);

      for (const d of (dests || [])) {
        if ((d as any).indexability_state === 'public_indexed' || !(d as any).indexability_state) {
          const lm = (d as any).updated_at?.split('T')[0] || now;
          urls.push({ loc: `${baseUrl}/${d.slug}`, lastmod: lm, priority: '0.9', changefreq: 'weekly', images: d.cover_image ? [d.cover_image] : undefined });
          urls.push({ loc: `${baseUrl}/things-to-do/${d.slug}`, lastmod: lm, priority: '0.85', changefreq: 'weekly' });
          urls.push({ loc: `${baseUrl}/${d.slug}/map`, lastmod: lm, priority: '0.5', changefreq: 'monthly' });
        }
      }
    }

    if (sitemapType === 'areas') {
      const { data: areas } = await supabase.from('areas')
        .select('slug, destination_id, updated_at, cover_image, indexability_state')
        .eq('is_active', true);
      const { data: dests } = await supabase.from('destinations').select('id, slug').eq('is_active', true);
      const destMap = new Map((dests || []).map((d: any) => [d.id, d.slug]));

      for (const a of (areas || [])) {
        if ((a as any).indexability_state === 'public_indexed' || !(a as any).indexability_state) {
          const ds = destMap.get(a.destination_id);
          if (ds) {
            urls.push({ loc: `${baseUrl}/${ds}/${a.slug}`, lastmod: (a as any).updated_at?.split('T')[0] || now, priority: '0.8', changefreq: 'weekly', images: a.cover_image ? [a.cover_image] : undefined });
          }
        }
      }
    }

    if (sitemapType === 'products') {
      const { data: products } = await supabase.from('products')
        .select('slug, destination_id, updated_at, cover_image, indexability_state, publish_score')
        .eq('is_active', true);
      const { data: dests } = await supabase.from('destinations').select('id, slug').eq('is_active', true);
      const destMap = new Map((dests || []).map((d: any) => [d.id, d.slug]));

      for (const p of (products || [])) {
        const state = (p as any).indexability_state || 'public_noindex';
        if (state === 'public_indexed' && ((p as any).publish_score || 0) >= 40) {
          const ds = p.destination_id ? destMap.get(p.destination_id) : 'explore';
          urls.push({ loc: `${baseUrl}/things-to-do/${ds || 'explore'}/${p.slug}`, lastmod: (p as any).updated_at?.split('T')[0] || now, priority: '0.8', changefreq: 'weekly', images: p.cover_image ? [p.cover_image] : undefined });
        }
      }
    }

    if (sitemapType === 'hosts') {
      const { data: hosts } = await supabase.from('hosts')
        .select('slug, updated_at, avatar_url, indexability_state')
        .eq('is_active', true);

      for (const h of (hosts || [])) {
        if ((h as any).indexability_state === 'public_indexed' || !(h as any).indexability_state) {
          urls.push({ loc: `${baseUrl}/hosts/${h.slug}`, lastmod: (h as any).updated_at?.split('T')[0] || now, priority: '0.7', changefreq: 'monthly', images: h.avatar_url ? [h.avatar_url] : undefined });
        }
      }
    }

    if (sitemapType === 'itineraries') {
      const { data: itins } = await supabase.from('public_itineraries')
        .select('slug, updated_at, cover_image, indexability_state')
        .eq('is_active', true);

      for (const it of (itins || [])) {
        if ((it as any).indexability_state === 'public_indexed' || !(it as any).indexability_state) {
          urls.push({ loc: `${baseUrl}/itineraries/${it.slug}`, lastmod: (it as any).updated_at?.split('T')[0] || now, priority: '0.7', changefreq: 'weekly', images: it.cover_image ? [it.cover_image] : undefined });
        }
      }
    }

    if (sitemapType === 'collections') {
      const { data: cols } = await supabase.from('collections')
        .select('slug, updated_at, indexability_state')
        .eq('is_active', true);

      for (const c of (cols || [])) {
        if ((c as any).indexability_state === 'public_indexed') {
          urls.push({ loc: `${baseUrl}/collections/${c.slug}`, lastmod: (c as any).updated_at?.split('T')[0] || now, priority: '0.6', changefreq: 'weekly' });
        }
      }
    }

    if (sitemapType === 'pois') {
      const { data: pois } = await supabase.from('pois')
        .select('slug, destination_id, updated_at, indexability_state')
        .eq('is_active', true);
      const { data: dests } = await supabase.from('destinations').select('id, slug').eq('is_active', true);
      const destMap = new Map((dests || []).map((d: any) => [d.id, d.slug]));

      for (const p of (pois || [])) {
        if ((p as any).indexability_state === 'public_indexed') {
          const ds = destMap.get((p as any).destination_id) || 'explore';
          urls.push({ loc: `${baseUrl}/things-to-do/${ds}/${p.slug}`, lastmod: (p as any).updated_at?.split('T')[0] || now, priority: '0.6', changefreq: 'monthly' });
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${(u.images || []).map(img => `
    <image:image><image:loc>${esc(img)}</image:loc></image:image>`).join('')}
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
