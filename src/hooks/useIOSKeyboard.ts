import { useState, useEffect } from "react";

/**
 * Unified iOS keyboard & visual-viewport tracker.
 * Returns the current visual viewport height so sheets / overlays
 * can size themselves to remain visible above the keyboard.
 */
export function useIOSKeyboard() {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined"
      ? window.visualViewport?.height ?? window.innerHeight
      : 800
  );
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const h = vv.height;
      setViewportHeight(h);
      // keyboard is considered open when visual viewport is significantly shorter
      setKeyboardOpen(window.innerHeight - h > 100);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return { viewportHeight, keyboardOpen };
}

/**
 * Lock / unlock scroll on body+html (for overlays & search).
 * Saves and restores scroll position to prevent jump.
 */
export function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  return scrollY;
}

export function unlockBodyScroll(savedScrollY: number) {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  window.scrollTo(0, savedScrollY);
}
