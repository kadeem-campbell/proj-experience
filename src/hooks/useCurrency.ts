import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'TZS', symbol: 'TSh', label: 'TZS (TSh)' },
  { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
];

// Fallback rates (used while live rates load or if API fails)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, GBP: 0.79, EUR: 0.92, TZS: 2500, KES: 153,
};

// Module-level shared state so all hook instances use the same rates
let sharedRates: Record<string, number> = { ...FALLBACK_RATES };
let ratesFetched = false;
let fetchPromise: Promise<void> | null = null;

async function fetchLiveRates() {
  if (ratesFetched) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // Check localStorage cache first (1 hour TTL)
      const cached = localStorage.getItem('swam-exchange-rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 60 * 60 * 1000) {
          sharedRates = parsed.rates;
          ratesFetched = true;
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('exchange-rates');
      if (error) throw error;

      if (data?.rates) {
        sharedRates = data.rates;
        ratesFetched = true;
        localStorage.setItem('swam-exchange-rates', JSON.stringify({ rates: data.rates, ts: Date.now() }));
        // Notify all hook instances to re-render
        window.dispatchEvent(new CustomEvent('swam-rates-updated'));
      }
    } catch (err) {
      console.warn('Failed to fetch live exchange rates, using fallback:', err);
      ratesFetched = true; // Don't retry endlessly
    }
  })();

  return fetchPromise;
}

/** Convert a USD amount to the target currency */
export const convertFromUSD = (amountUSD: number, targetCode: string): number => {
  const rate = sharedRates[targetCode] || FALLBACK_RATES[targetCode] || 1;
  return Math.round(amountUSD * rate);
};

/** Format a converted price for display */
export const formatPrice = (amountUSD: number, targetCode: string): string => {
  const info = CURRENCIES.find(c => c.code === targetCode) || CURRENCIES[0];
  const converted = convertFromUSD(amountUSD, targetCode);
  return `${info.symbol}${converted.toLocaleString()}`;
};

/** Auto-detect currency from timezone/locale — runs once */
export const detectCurrency = (): string => {
  const saved = localStorage.getItem('swam-currency');
  if (saved && CURRENCIES.some(c => c.code === saved)) return saved;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const locale = navigator.language || '';
    if (tz.includes('London') || tz.includes('Europe/London') || locale.startsWith('en-GB')) return 'GBP';
    if (tz.includes('Europe/') && !tz.includes('London')) return 'EUR';
    if (tz.includes('Nairobi') || locale.includes('KE')) return 'KES';
    if (tz.includes('Dar_es_Salaam') || locale.includes('TZ')) return 'TZS';
  } catch {}
  return 'USD';
};

export const setGlobalCurrency = (code: string) => {
  localStorage.setItem('swam-currency', code);
  window.dispatchEvent(new CustomEvent('swam-currency-change', { detail: code }));
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState(() => detectCurrency());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Fetch live rates on mount
    fetchLiveRates();

    const currencyHandler = (e: Event) => setCurrency((e as CustomEvent).detail);
    const ratesHandler = () => forceUpdate(n => n + 1);

    window.addEventListener('swam-currency-change', currencyHandler);
    window.addEventListener('swam-rates-updated', ratesHandler);
    return () => {
      window.removeEventListener('swam-currency-change', currencyHandler);
      window.removeEventListener('swam-rates-updated', ratesHandler);
    };
  }, []);

  const updateCurrency = (code: string) => {
    setGlobalCurrency(code);
    setCurrency(code);
  };

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  /** Convert USD amount to current currency and format */
  const convert = useCallback((amountUSD: number) => formatPrice(amountUSD, currency), [currency]);

  return { currency, currencyInfo, updateCurrency, convert, CURRENCIES };
};
