import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

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

    // open.er-api.com is free, no key needed, supports 150+ currencies
    const res = await fetch('https://open.er-api.com/v6/latest/USD');

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Exchange rate API error [${res.status}]: ${text}`);
    }

    const data = await res.json();
    
    // Extract only the currencies we need
    const needed = ['USD', 'GBP', 'EUR', 'TZS', 'KES'];
    const rates: Record<string, number> = {};
    for (const code of needed) {
      rates[code] = data.rates?.[code] ?? null;
    }
    rates.USD = 1;

    cachedRates = rates;
    cacheTimestamp = now;

    return new Response(JSON.stringify({ rates, date: data.time_last_update_utc }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return new Response(JSON.stringify({
      rates: { USD: 1, GBP: 0.79, EUR: 0.92, TZS: 2500, KES: 153 },
      fallback: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
