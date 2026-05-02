import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to top on route (pathname) changes only.
 * Intentionally lightweight: a single sync scrollTo on the window plus
 * the explicit scroll roots used by the mobile shell. Avoids querySelectorAll
 * across the whole document and avoids double-RAF restorations that cause
 * a visible jitter on tab switches.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Window scroll (covers desktop and any page that scrolls the document).
    window.scrollTo(0, 0);

    // Known mobile scroll containers used by the shell. Cheap, targeted.
    const roots = document.querySelectorAll<HTMLElement>(
      "[data-scroll-root='true']"
    );
    for (const el of roots) {
      el.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};
