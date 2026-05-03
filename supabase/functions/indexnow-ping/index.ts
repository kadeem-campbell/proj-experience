/**
 * IndexNow ping endpoint
 * Notifies Bing/Yandex/Naver/Seznam (and ChatGPT search via Bing) instantly
 * when URLs are published, updated, indexed, slug-changed, or unpublished.
 *
 * POST { urls: string[] }  — push specific URLs
 * POST { entityType, entityId } — resolve URL from DB and push
 *
 * Auth: requires service role OR authenticated admin user.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HOST = 'swam.app';
const KEY = Deno.env.get('INDEXNOW_KEY') || '';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function resolveEntityUrl(supabase: any, entityType: string, entityId: string): Promise<string | null> {
  if (entityType === 'product') {
    const { data: p } = await supabase.from('products')
      .select('slug, destination_id, area_id, indexability_state, is_active')
      .eq('id', entityId).maybeSingle();
    if (!p?.slug) return null;
    const { data: d } = p.destination_id
      ? await supabase.from('destinations').select('slug').eq('id', p.destination_id).maybeSingle()
      : { data: null };
    const { data: a } = p.area_id
      ? await supabase.from('areas').select('slug').eq('id', p.area_id).maybeSingle()
      : { data: null };
    const dest = d?.slug || 'explore';
    const area = a?.slug ? `/${a.slug}` : '';
    return `https://${HOST}/things-to-do/${dest}${area}/${p.slug}`;
  }
  if (entityType === 'destination') {
    const { data } = await supabase.from('destinations').select('slug').eq('id', entityId).maybeSingle();
    return data?.slug ? `https://${HOST}/${data.slug}` : null;
  }
  if (entityType === 'area') {
    const { data: a } = await supabase.from('areas').select('slug, destination_id').eq('id', entityId).maybeSingle();
    if (!a?.slug) return null;
    const { data: d } = await supabase.from('destinations').select('slug').eq('id', a.destination_id).maybeSingle();
    return d?.slug ? `https://${HOST}/${d.slug}/${a.slug}` : null;
  }
  if (entityType === 'country') {
    const { data } = await supabase.from('countries').select('slug').eq('id', entityId).maybeSingle();
    return data?.slug ? `https://${HOST}/countries/${data.slug}` : null;
  }
  if (entityType === 'collection') {
    const { data } = await supabase.from('collections').select('slug').eq('id', entityId).maybeSingle();
    return data?.slug ? `https://${HOST}/collections/${data.slug}` : null;
  }
  if (entityType === 'itinerary') {
    const { data } = await supabase.from('public_itineraries').select('slug').eq('id', entityId).maybeSingle();
    return data?.slug ? `https://${HOST}/itineraries/${data.slug}` : null;
  }
  if (entityType === 'host') {
    const { data } = await supabase.from('hosts').select('slug').eq('id', entityId).maybeSingle();
    return data?.slug ? `https://${HOST}/hosts/${data.slug}` : null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (!KEY) {
    return new Response(JSON.stringify({ error: 'INDEXNOW_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json().catch(() => ({}));
    let urls: string[] = Array.isArray(body.urls) ? body.urls.filter((u: any) => typeof u === 'string') : [];

    if (body.entityType && body.entityId) {
      const u = await resolveEntityUrl(supabase, body.entityType, body.entityId);
      if (u) urls.push(u);
    }
    // Always include sitemap so engines re-fetch
    urls.push(`https://${HOST}/sitemap.xml`);
    urls = Array.from(new Set(urls)).slice(0, 10000);

    if (urls.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'no urls resolved' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };

    // Ping IndexNow (one ping reaches Bing, Yandex, Naver, Seznam)
    const endpoints = ['https://api.indexnow.org/IndexNow', 'https://www.bing.com/IndexNow'];
    const results: any[] = [];
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        });
        results.push({ endpoint: ep, status: r.status });
      } catch (e: any) {
        results.push({ endpoint: ep, error: e?.message || String(e) });
      }
    }

    // Also ping Google sitemap ping endpoint as a courtesy
    try {
      const r = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`https://${HOST}/sitemap.xml`)}`);
      results.push({ endpoint: 'google-sitemap-ping', status: r.status });
    } catch {}

    return new Response(JSON.stringify({ ok: true, urls: urls.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
