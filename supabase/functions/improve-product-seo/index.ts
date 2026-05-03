// Improve product SEO fields with Lovable AI Gateway.
// Returns suggested seo_title, seo_description, description, highlights[].
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { product_id, apply = false } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: product, error } = await supabase.from('products')
      .select('id, title, description, seo_title, seo_description, highlights_json, destination_id, activity_type_id')
      .eq('id', product_id).maybeSingle();
    if (error || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: dest } = await supabase.from('destinations').select('name').eq('id', product.destination_id).maybeSingle();
    const { data: cat } = await supabase.from('activity_types').select('name').eq('id', product.activity_type_id).maybeSingle();

    const apiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const prompt = `You are an SEO copywriter for a premium travel discovery app (better than GetYourGuide, Airbnb Experiences). Rewrite for maximum clarity, search ranking, and AI-crawler comprehension. Return STRICT JSON.

Product title: ${product.title}
Destination: ${dest?.name || 'unknown'}
Category: ${cat?.name || 'activity'}
Existing description: ${product.description || ''}

Return JSON with EXACTLY these keys:
{
  "seo_title": string (max 60 chars, includes destination + activity),
  "seo_description": string (max 155 chars, compelling, includes price/value hook),
  "description": string (180-260 words, vivid, scannable, paragraphs),
  "highlights": string[] (5-8 bullets, each <=80 chars, benefit-led)
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
      await supabase.from('products').update({
        seo_title: suggestion.seo_title,
        seo_description: suggestion.seo_description,
        description: suggestion.description,
        highlights_json: suggestion.highlights,
      }).eq('id', product_id);
    }

    return new Response(JSON.stringify({ suggestion, applied: apply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
