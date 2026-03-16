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

    // If requesting sitemap index
    if (sitemapType === 'index') {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${baseUrl}/sitemap.xml?type=static</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=destinations</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=products</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=itineraries</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=hosts</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=collections</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${baseUrl}/sitemap.xml?type=areas</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`;
      return new Response(sitemapIndex, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      });
    }

    const urls: { loc: string; lastmod: string; priority: string; changefreq: string; images?: string[] }[] = [];

    if (sitemapType === 'static') {
      urls.push({ loc: `${baseUrl}/`, lastmod: now, priority: '1.0', changefreq: 'daily' });
      urls.push({ loc: `${baseUrl}/things-to-do`, lastmod: now, priority: '0.9', changefreq: 'daily' });
      urls.push({ loc: `${baseUrl}/itineraries`, lastmod: now, priority: '0.8', changefreq: 'weekly' });
      urls.push({ loc: `${baseUrl}/hosts`, lastmod: now, priority: '0.7', changefreq: 'weekly' });
      urls.push({ loc: `${baseUrl}/explore/map`, lastmod: now, priority: '0.6', changefreq: 'weekly' });
    }

    if (sitemapType === 'destinations') {
      const { data: destinations } = await supabase.from('destinations')
        .select('slug, updated_at, cover_image, indexability_state')
        .eq('is_active', true);

      (destinations || []).forEach((d: any) => {
        if (d.indexability_state === 'public_indexed' || !d.indexability_state || d.indexability_state === '') {
          const lastmod = d.updated_at?.split('T')[0] || now;
          urls.push({
            loc: `${baseUrl}/${d.slug}`,
            lastmod,
            priority: '0.9',
            changefreq: 'weekly',
            images: d.cover_image ? [d.cover_image] : undefined,
          });
          urls.push({
            loc: `${baseUrl}/things-to-do/${d.slug}`,
            lastmod,
            priority: '0.85',
            changefreq: 'weekly',
          });
        }
      });
    }

    if (sitemapType === 'areas') {
      const { data: areas } = await supabase.from('areas')
        .select('slug, destination_id, updated_at, cover_image, indexability_state')
        .eq('is_active', true);
      const { data: destinations } = await supabase.from('destinations')
        .select('id, slug').eq('is_active', true);

      const destMap = new Map<string, string>();
      (destinations || []).forEach((d: any) => destMap.set(d.id, d.slug));

      (areas || []).forEach((a: any) => {
        if (a.indexability_state === 'public_indexed' || !a.indexability_state) {
          const destSlug = destMap.get(a.destination_id);
          if (destSlug) {
            urls.push({
              loc: `${baseUrl}/${destSlug}/${a.slug}`,
              lastmod: a.updated_at?.split('T')[0] || now,
              priority: '0.8',
              changefreq: 'weekly',
              images: a.cover_image ? [a.cover_image] : undefined,
            });
          }
        }
      });
    }

    if (sitemapType === 'products') {
      const { data: products } = await supabase.from('products')
        .select('slug, destination_id, updated_at, cover_image, indexability_state, publish_score, is_indexable')
        .eq('is_active', true);
      const { data: destinations } = await supabase.from('destinations')
        .select('id, slug').eq('is_active', true);

      const destMap = new Map<string, string>();
      (destinations || []).forEach((d: any) => destMap.set(d.id, d.slug));

      (products || []).forEach((p: any) => {
        const state = p.indexability_state || (p.is_indexable !== false ? 'public_indexed' : 'public_noindex');
        const score = p.publish_score || 0;
        if (state === 'public_indexed' && score >= 40) {
          const destSlug = p.destination_id ? destMap.get(p.destination_id) : 'explore';
          urls.push({
            loc: `${baseUrl}/things-to-do/${destSlug || 'explore'}/${p.slug}`,
            lastmod: p.updated_at?.split('T')[0] || now,
            priority: '0.8',
            changefreq: 'weekly',
            images: p.cover_image ? [p.cover_image] : undefined,
          });
        }
      });
    }

    if (sitemapType === 'hosts') {
      const { data: hosts } = await supabase.from('hosts')
        .select('slug, updated_at, avatar_url, indexability_state')
        .eq('is_active', true);

      (hosts || []).forEach((h: any) => {
        if (h.indexability_state === 'public_indexed' || !h.indexability_state) {
          urls.push({
            loc: `${baseUrl}/hosts/${h.slug}`,
            lastmod: h.updated_at?.split('T')[0] || now,
            priority: '0.7',
            changefreq: 'monthly',
            images: h.avatar_url ? [h.avatar_url] : undefined,
          });
        }
      });
    }

    if (sitemapType === 'itineraries') {
      const { data: itineraries } = await supabase.from('public_itineraries')
        .select('slug, updated_at, cover_image, indexability_state')
        .eq('is_active', true);

      (itineraries || []).forEach((it: any) => {
        if (it.indexability_state === 'public_indexed' || !it.indexability_state) {
          urls.push({
            loc: `${baseUrl}/itineraries/${it.slug}`,
            lastmod: it.updated_at?.split('T')[0] || now,
            priority: '0.7',
            changefreq: 'weekly',
            images: it.cover_image ? [it.cover_image] : undefined,
          });
        }
      });
    }

    if (sitemapType === 'collections') {
      const { data: collections } = await supabase.from('collections')
        .select('slug, collection_type, content_type, updated_at, indexability_state')
        .eq('is_active', true);

      (collections || []).forEach((c: any) => {
        if (c.indexability_state === 'public_indexed') {
          const prefix = c.content_type === 'itinerary' ? 'itineraries' : 'experiences';
          urls.push({
            loc: `${baseUrl}/collections/${prefix}/${c.slug}`,
            lastmod: c.updated_at?.split('T')[0] || now,
            priority: '0.6',
            changefreq: 'weekly',
          });
        }
      });
    }

    // Build XML with optional image support
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${(u.images || []).map(img => `
    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
    </image:image>`).join('')}
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
