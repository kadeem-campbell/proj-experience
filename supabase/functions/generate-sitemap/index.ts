const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Fetch all entities in parallel
    const [
      { data: destinations },
      { data: products },
      { data: hosts },
      { data: publicItineraries },
      { data: collections },
      { data: experiences },
      { data: areas },
    ] = await Promise.all([
      supabase.from('destinations').select('slug, updated_at').eq('is_active', true),
      supabase.from('products').select('slug, destination_id, updated_at').eq('is_active', true),
      supabase.from('hosts').select('slug, updated_at').eq('is_active', true),
      supabase.from('public_itineraries').select('slug, updated_at').eq('is_active', true),
      supabase.from('collections').select('slug, collection_type, updated_at').eq('is_active', true),
      supabase.from('experiences').select('slug, updated_at').eq('is_active', true),
      supabase.from('areas').select('slug, destination_id, updated_at').eq('is_active', true),
    ]);

    // Build destination slug lookup
    const destMap = new Map<string, string>();
    (destinations || []).forEach((d: any) => destMap.set(d.id, d.slug));

    const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [];

    // Static pages
    urls.push({ loc: `${baseUrl}/`, lastmod: now, priority: '1.0', changefreq: 'daily' });
    urls.push({ loc: `${baseUrl}/things-to-do`, lastmod: now, priority: '0.9', changefreq: 'daily' });
    urls.push({ loc: `${baseUrl}/itineraries`, lastmod: now, priority: '0.8', changefreq: 'weekly' });
    urls.push({ loc: `${baseUrl}/hosts`, lastmod: now, priority: '0.7', changefreq: 'weekly' });
    urls.push({ loc: `${baseUrl}/explore/map`, lastmod: now, priority: '0.6', changefreq: 'weekly' });

    // Destinations
    (destinations || []).forEach((d: any) => {
      urls.push({ loc: `${baseUrl}/${d.slug}`, lastmod: d.updated_at?.split('T')[0] || now, priority: '0.9', changefreq: 'weekly' });
      urls.push({ loc: `${baseUrl}/things-to-do/${d.slug}`, lastmod: d.updated_at?.split('T')[0] || now, priority: '0.85', changefreq: 'weekly' });
    });

    // Areas
    (areas || []).forEach((a: any) => {
      const destSlug = destMap.get(a.destination_id);
      if (destSlug) {
        urls.push({ loc: `${baseUrl}/things-to-do/${destSlug}/${a.slug}`, lastmod: a.updated_at?.split('T')[0] || now, priority: '0.8', changefreq: 'weekly' });
      }
    });

    // Products
    (products || []).forEach((p: any) => {
      const destSlug = p.destination_id ? destMap.get(p.destination_id) : 'explore';
      urls.push({ loc: `${baseUrl}/things-to-do/${destSlug || 'explore'}/${p.slug}`, lastmod: p.updated_at?.split('T')[0] || now, priority: '0.8', changefreq: 'weekly' });
    });

    // Hosts
    (hosts || []).forEach((h: any) => {
      urls.push({ loc: `${baseUrl}/hosts/${h.slug}`, lastmod: h.updated_at?.split('T')[0] || now, priority: '0.7', changefreq: 'monthly' });
    });

    // Public itineraries
    (publicItineraries || []).forEach((it: any) => {
      urls.push({ loc: `${baseUrl}/itineraries/${it.slug}`, lastmod: it.updated_at?.split('T')[0] || now, priority: '0.7', changefreq: 'weekly' });
    });

    // Collections
    (collections || []).forEach((c: any) => {
      const prefix = c.collection_type === 'itineraries' ? 'itinerary-collections' : 'experience-collections';
      urls.push({ loc: `${baseUrl}/${prefix}/${c.slug}`, lastmod: c.updated_at?.split('T')[0] || now, priority: '0.6', changefreq: 'weekly' });
    });

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
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
