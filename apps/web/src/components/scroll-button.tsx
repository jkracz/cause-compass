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

  // Don't render at all if can't scroll in this direction
  if (!canScroll) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hidden md:flex items-center justify-center",
        "absolute top-0 bottom-4 z-10",
        "w-12 md:w-14",
        "bg-black/30",
        "text-white/80 transition-all duration-300",
        "hover:bg-black/50 hover:text-white",
        "focus:outline-none",
        direction === "left" ? "left-0" : "right-0",
        isRowHovered ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="h-9 w-9" strokeWidth={1.5} />
    </button>
  );
}
