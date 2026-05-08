"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  canScroll: boolean;
  isRowHovered: boolean;
  className?: string;
}

export function ScrollButton({
  direction,
  onClick,
  canScroll,
  isRowHovered,
  className,
}: ScrollButtonProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  if (!canScroll) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-0 bottom-4 z-10 hidden w-12 items-center justify-center bg-gradient-to-r text-[var(--ink-soft)] transition-all duration-300 hover:text-[var(--accent)] focus:outline-none md:flex md:w-14",
        direction === "left"
          ? "left-0 from-[var(--paper)] via-[var(--paper)]/85 to-transparent"
          : "right-0 from-transparent via-[var(--paper)]/85 to-[var(--paper)]",
        isRowHovered ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-9 w-9" strokeWidth={1.5} />
    </button>
  );
}
