import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, destinationId } = await req.json();
    if (!query || typeof query !== "string" || query.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products for context
    let productsQuery = supabase
      .from("products")
      .select("id, title, slug, description, cover_image_url, average_price_per_person, destination_id, destinations(name, slug)")
      .eq("visibility_state", "published")
      .limit(100);

    if (destinationId) {
      productsQuery = productsQuery.eq("destination_id", destinationId);
    }

    const { data: products } = await productsQuery;
    const productList = (products || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: (p.description || "").slice(0, 150),
      price: p.average_price_per_person,
      destination: p.destinations?.name || "",
      destinationSlug: p.destinations?.slug || "",
      image: p.cover_image_url,
    }));

    // Also fetch public itineraries
    const { data: itineraries } = await supabase
      .from("public_itineraries")
      .select("id, name, slug, cover_image, like_count, experiences")
      .eq("is_active", true)
      .limit(50);

    const itineraryList = (itineraries || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      image: i.cover_image,
      likes: i.like_count,
      experienceCount: Array.isArray(i.experiences) ? i.experiences.length : 0,
    }));

    const systemPrompt = `You are a travel discovery assistant for SWAM, a platform for experiences in East Africa (Zanzibar, Kenya, Tanzania).

Given the user's search query, return the most relevant products and itineraries from the catalog. Also provide a brief, friendly 1-2 sentence summary of what you found.

IMPORTANT: Only return items that genuinely match the user's intent. Prioritize:
1. Title matches (exact or close)
2. Description/category relevance
3. Location relevance

Available products:
${JSON.stringify(productList)}

Available itineraries:
${JSON.stringify(itineraryList)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_search_results",
              description: "Return matched products and itineraries with a summary",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief friendly summary of what was found (1-2 sentences)" },
                  productIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of product IDs that match the query, ordered by relevance",
                  },
                  itineraryIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of itinerary IDs that match the query, ordered by relevance",
                  },
                },
                required: ["summary", "productIds", "itineraryIds"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_search_results" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI search temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ summary: "No results found", products: [], itineraries: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Enrich with full product data
    const matchedProducts = (result.productIds || [])
      .map((id: string) => productList.find((p: any) => p.id === id))
      .filter(Boolean);

    const matchedItineraries = (result.itineraryIds || [])
      .map((id: string) => itineraryList.find((i: any) => i.id === id))
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        summary: result.summary || "",
        products: matchedProducts,
        itineraries: matchedItineraries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
