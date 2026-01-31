"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { OrganizationCard } from "@/components/organization-card";
import { ScrollButton } from "@/components/scroll-button";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { Doc } from "@cause/backend/convex/_generated/dataModel";

type Organization = Doc<"organizations">;

const CARD_WIDTH = 280;
const CARD_GAP = 16;

interface CategoryRowProps {
  title: string;
  organizations: Organization[];
  onCardClick: (org: Organization) => void;
  delay?: number;
}

export function CategoryRow({
  title,
  organizations,
  onCardClick,
  delay = 0,
}: CategoryRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate scroll amount based on container width (scroll by visible cards)
  const getScrollAmount = useCallback(() => {
    const container = document.querySelector(`[data-row="${title}"]`);
    if (!container) return CARD_WIDTH + CARD_GAP;
    const containerWidth = container.clientWidth;
    const cardsPerPage = Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP));
    return Math.max(1, cardsPerPage) * (CARD_WIDTH + CARD_GAP);
  }, [title]);

  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    updateScrollState,
  } = useHorizontalScroll({ scrollAmount: getScrollAmount() });

  // Update scroll state when organizations change
  useEffect(() => {
    updateScrollState();
  }, [organizations, updateScrollState]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      updateScrollState();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  if (organizations.length === 0) {
    return null;
  }

  const handleScrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = getScrollAmount();
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = getScrollAmount();
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title - Netflix style: bold, larger text */}
      <div className="mb-3 px-4 md:px-14">
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl md:text-2xl">
          {title}
        </h2>
      </div>

      {/* Carousel container with overlay arrows */}
      <div className="relative">
        {/* Left scroll button - only shows after user has scrolled */}
        <ScrollButton
          direction="left"
          onClick={handleScrollLeft}
          canScroll={canScrollLeft}
          isRowHovered={isHovered}
        />

        {/* Scrollable card container */}
        <div
          ref={scrollContainerRef}
          data-row={title}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pl-4 pb-4 md:pl-14"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {organizations.map((org, index) => (
            <motion.div
              key={org._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: delay + Math.min(index * 0.04, 0.25),
              }}
              className="w-[260px] flex-shrink-0 sm:w-[280px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <OrganizationCard
                organization={org}
                onClick={() => onCardClick(org)}
              />
            </motion.div>
          ))}

          {/* Right spacer for peek effect */}
          <div className="w-4 flex-shrink-0 md:w-14" />
        </div>

        {/* Right scroll button */}
        <ScrollButton
          direction="right"
          onClick={handleScrollRight}
          canScroll={canScrollRight}
          isRowHovered={isHovered}
        />
      </div>
    </motion.section>
  );
}
