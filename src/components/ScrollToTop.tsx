import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const previousValue = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const scrollRoots = document.querySelectorAll<HTMLElement>(
        "main, [data-scroll-root='true'], .overflow-auto, .overflow-y-auto, [data-radix-scroll-area-viewport]"
      );

      scrollRoots.forEach((element) => {
        element.scrollTop = 0;
        element.scrollLeft = 0;
        element.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
      });
    };

    resetScroll();

    let frameTwo = 0;
    const frameOne = window.requestAnimationFrame(() => {
      resetScroll();
      frameTwo = window.requestAnimationFrame(resetScroll);
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [key, pathname, search, hash]);

  return null;
};
