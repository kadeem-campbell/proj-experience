import { useState, useEffect, useCallback, useRef } from "react";

export function useScrollHeader(threshold = 50) {
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Show header when scrolling up or at top
        if (currentScrollY < lastScrollY.current || currentScrollY < threshold) {
          setShowHeader(true);
        } 
        // Hide header when scrolling down past threshold
        else if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
          setShowHeader(false);
        }
        
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return showHeader;
}
