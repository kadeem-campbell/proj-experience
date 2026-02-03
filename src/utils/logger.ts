/**
 * Production-safe logger utility.
 * Only logs in development mode to prevent information disclosure.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors but sanitize in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log minimal error info
      console.error('[Error]', args[0] instanceof Error ? args[0].message : 'An error occurred');
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};
