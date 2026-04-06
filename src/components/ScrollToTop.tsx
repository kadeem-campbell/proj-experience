import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useLayoutEffect(() => {
    if (navType !== "POP") {
      // Reset window scroll
      window.scrollTo(0, 0);

      // Also reset any overflow-auto containers used by MainLayout
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [pathname, navType]);

  return null;
};
