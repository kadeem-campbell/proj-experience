import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache rates for 1 hour in memory
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    if (cachedRates && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ rates: cachedRates, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the free frankfurter.app API (no key needed, ECB data)
    const targets = 'USD,GBP,EUR,TZS,KES';
    const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${targets}`);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Frankfurter API error [${res.status}]: ${text}`);
    }

    const data = await res.json();
    const rates: Record<string, number> = { USD: 1, ...data.rates };

    cachedRates = rates;
    cacheTimestamp = now;

    return new Response(JSON.stringify({ rates, date: data.date }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    // Return fallback rates if API fails
    return new Response(JSON.stringify({
      rates: { USD: 1, GBP: 0.79, EUR: 0.92, TZS: 2500, KES: 153 },
      fallback: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
