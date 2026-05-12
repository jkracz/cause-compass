"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseHorizontalScrollOptions {
  scrollAmount?: number;
}

export function useHorizontalScroll(options: UseHorizontalScrollOptions = {}) {
  const { scrollAmount = 600 } = options;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Absorbs the trailing flex-spacer (~24px) and any subpixel
    // scroll positions left by smooth-scroll / momentum scroll.
    const EDGE_TOLERANCE = 32;
    setCanScrollLeft(scrollLeft > EDGE_TOLERANCE);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - EDGE_TOLERANCE);
  }, []);

  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, [scrollAmount]);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, [scrollAmount]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();

    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
    updateScrollState,
  };
}
