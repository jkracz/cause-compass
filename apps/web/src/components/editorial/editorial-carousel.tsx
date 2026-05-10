"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";
import { SectionHeader } from "@/components/editorial/section-header";
import { ScrollButton } from "@/components/scroll-button";

type Organization = Doc<"organizations">;

const CARD_WIDTH = 300;
const CARD_GAP = 18;

interface EditorialCarouselProps {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
  organizations: Organization[];
  onCardClick: (org: Organization) => void;
  browseHref?: string;
  rowKey: string;
}

export function EditorialCarousel({
  kicker,
  title,
  subtitle,
  organizations,
  onCardClick,
  browseHref,
  rowKey,
}: EditorialCarouselProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getScrollAmount = useCallback(() => {
    const container = document.querySelector(`[data-row="${rowKey}"]`);
    if (!container) return CARD_WIDTH + CARD_GAP;
    const containerWidth = container.clientWidth;
    const cardsPerPage = Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP));
    return Math.max(1, cardsPerPage) * (CARD_WIDTH + CARD_GAP);
  }, [rowKey]);

  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    updateScrollState,
  } = useHorizontalScroll({ scrollAmount: getScrollAmount() });

  useEffect(() => {
    updateScrollState();
  }, [organizations, updateScrollState]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  if (organizations.length === 0) return null;

  const handleScrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  };

  const handleScrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  };

  return (
    <section
      className="space-y-5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        action={
          browseHref ? (
            <Link
              href={browseHref}
              className="group inline-flex items-center gap-1.5 rounded-sm text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase transition-colors hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--paper)] focus-visible:outline-none"
            >
              <span className="underline-offset-[6px] group-hover:underline group-hover:decoration-[var(--accent)]/60">
                See more
              </span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : undefined
        }
      />

      <div className="relative -mx-4 md:-mx-8">
        {canScrollLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-4 left-0 z-[5] w-12 bg-gradient-to-r from-[var(--paper)] via-[var(--paper)]/85 to-transparent md:w-14"
          />
        )}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 bottom-4 z-[5] w-12 bg-gradient-to-l from-[var(--paper)] via-[var(--paper)]/85 to-transparent md:w-14"
          />
        )}

        <ScrollButton
          direction="left"
          onClick={handleScrollLeft}
          canScroll={canScrollLeft}
          isRowHovered={isHovered}
        />

        <div
          ref={scrollContainerRef}
          data-row={rowKey}
          className="scrollbar-hide flex gap-[18px] overflow-x-auto scroll-smooth px-4 pb-4 md:px-8"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {organizations.map((org) => (
            <div
              key={org._id}
              className="w-[280px] flex-shrink-0 sm:w-[300px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <EditorialOrgCard
                organization={org}
                onClick={() => onCardClick(org)}
              />
            </div>
          ))}

          <div className="w-2 flex-shrink-0 md:w-6" aria-hidden />
        </div>

        <ScrollButton
          direction="right"
          onClick={handleScrollRight}
          canScroll={canScrollRight}
          isRowHovered={isHovered}
        />
      </div>
    </section>
  );
}
