// Universal SEO improver — works for any entity table
// Body: { entity_type: 'destination'|'country'|'area'|'poi'|'itinerary'|'category'|'host'|'collection', entity_id: string, apply?: boolean }
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENTITY_MAP: Record<string, { table: string; titleField: string; descField: string }> = {
  destination: { table: 'destinations', titleField: 'name', descField: 'description' },
  country: { table: 'countries', titleField: 'name', descField: 'long_description' },
  area: { table: 'areas', titleField: 'name', descField: 'description' },
  poi: { table: 'pois', titleField: 'name', descField: 'description' },
  itinerary: { table: 'public_itineraries', titleField: 'name', descField: 'description' },
  category: { table: 'categories', titleField: 'name', descField: 'description' },
  host: { table: 'hosts', titleField: 'name', descField: 'bio' },
  collection: { table: 'collections', titleField: 'name', descField: 'description' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { entity_type, entity_id, apply = false } = await req.json();
    const cfg = ENTITY_MAP[entity_type];
    if (!cfg || !entity_id) {
      return new Response(JSON.stringify({ error: 'entity_type + entity_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: entity, error } = await supabase.from(cfg.table).select('*').eq('id', entity_id).maybeSingle();
    if (error || !entity) {
      return new Response(JSON.stringify({ error: 'Entity not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const title = entity[cfg.titleField];
    const existingDesc = entity[cfg.descField] || entity.short_description || '';

    const apiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const prompt = `You are an SEO copywriter for a premium travel discovery app (better than GetYourGuide, Airbnb Experiences). Write for maximum clarity, search ranking, and AI-crawler comprehension. Return STRICT JSON.

Entity type: ${entity_type}
Name: ${title}
Existing description: ${existingDesc}

Return JSON with EXACTLY these keys:
{
  "seo_title": string (max 60 chars, includes name + travel angle),
  "seo_description": string (max 155 chars, compelling),
  "short_description": string (1 sentence, ~140 chars),
  "long_description": string (180-260 words, vivid, scannable)
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: 'AI failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || '{}';
    const suggestion = JSON.parse(content);

    if (apply) {
      const update: Record<string, any> = {
        seo_title: suggestion.seo_title,
        seo_description: suggestion.seo_description,
      };
      // only set columns that exist on the entity
      if ('short_description' in entity) update.short_description = suggestion.short_description;
      if ('long_description' in entity) update.long_description = suggestion.long_description;
      if (cfg.descField in entity) update[cfg.descField] = suggestion.long_description || suggestion.short_description;
      await supabase.from(cfg.table).update(update).eq('id', entity_id);
    }

    return new Response(JSON.stringify({ suggestion, applied: apply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
