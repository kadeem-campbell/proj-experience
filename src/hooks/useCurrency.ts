import { useState, useEffect } from 'react';
// Using localStorage + a simple React hook pattern instead

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'TZS', symbol: 'TSh', label: 'TZS (TSh)' },
  { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
];

/** Auto-detect currency from timezone/locale — runs once */
export const detectCurrency = (): string => {
  // Check if user manually set one
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

/** Set preferred currency globally */
export const setGlobalCurrency = (code: string) => {
  localStorage.setItem('swam-currency', code);
  window.dispatchEvent(new CustomEvent('swam-currency-change', { detail: code }));
};

/** React hook that returns the current global currency and listens for changes */
import { useState, useEffect } from 'react';

export const useCurrency = () => {
  const [currency, setCurrency] = useState(() => detectCurrency());

  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail;
      setCurrency(code);
    };
    window.addEventListener('swam-currency-change', handler);
    return () => window.removeEventListener('swam-currency-change', handler);
  }, []);

  const updateCurrency = (code: string) => {
    setGlobalCurrency(code);
    setCurrency(code);
  };

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return { currency, currencyInfo, updateCurrency, CURRENCIES };
};
