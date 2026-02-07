import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HideOnScrollHeaderProps {
  children: ReactNode;
  className?: string;
}

export const HideOnScrollHeader = ({ children, className }: HideOnScrollHeaderProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollThreshold = 10; // Minimum scroll distance to trigger

      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      if (scrollingDown && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Use the main content scroll container if available
    const scrollContainer = document.querySelector('main.overflow-auto');
    const target = scrollContainer || window;

    const onScroll = () => {
      const scrollY = scrollContainer ? (scrollContainer as HTMLElement).scrollTop : window.scrollY;
      const scrollingDown = scrollY > lastScrollY;
      const scrollThreshold = 10;

      if (Math.abs(scrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      if (scrollingDown && scrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(scrollY);
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  return (
    <div
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 transition-transform duration-300 ease-out",
        !isVisible && "-translate-y-full",
        className
      )}
    >
      {children}
    </div>
  );
};
