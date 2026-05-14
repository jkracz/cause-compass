"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  PanInfo,
} from "motion/react";

import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { sanitizeTagline } from "@cause/lib";
import { OrgMark } from "@/components/editorial/org-mark";

type Organization = Doc<"organizations">;

interface SwipeableCardProps {
  organization: Organization;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onOpen?: () => void;
  interactive?: boolean;
}

export function SwipeableCard({
  organization,
  onSwipeLeft,
  onSwipeRight,
  onOpen,
  interactive = true,
}: SwipeableCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [exitX, setExitX] = useState<number | null>(null);
  const draggedRef = useRef(false);

  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [-10, 10],
  );
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const saveOpacity = useTransform(x, [20, 90], [0, 1]);
  const skipOpacity = useTransform(x, [-90, -20], [1, 0]);
  const rightEdgeOpacity = useTransform(x, [0, 110], [0, 1]);
  const leftEdgeOpacity = useTransform(x, [-110, 0], [1, 0]);

  const previewText =
    sanitizeTagline(organization.tagline) ||
    organization.oneSentenceSummary ||
    organization.whySupport ||
    organization.mission;

  const keywords = organization.keywords?.slice(0, 3) ?? [];
  const location =
    organization.city && organization.state
      ? `${organization.city}, ${organization.state}`
      : organization.city || organization.state || null;

  const handleDragStart = () => {
    draggedRef.current = true;
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x > 100) {
      setExitX(240);
      setTimeout(() => onSwipeRight(), 180);
    } else if (info.offset.x < -100) {
      setExitX(-240);
      setTimeout(() => onSwipeLeft(), 180);
    }
  };

  const handleTap = () => {
    if (!interactive || !onOpen) return;
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onOpen();
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        width: "100%",
        height: "100%",
      }}
      drag={interactive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={interactive ? handleDragStart : undefined}
      onDragEnd={interactive ? handleDragEnd : undefined}
      onTap={handleTap}
      animate={exitX !== null ? { x: exitX, opacity: 0 } : undefined}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="touch-pan-y select-none"
    >
      <article
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        aria-label={onOpen ? `${organization.name} — view details` : undefined}
        onKeyDown={(e) => {
          if (!onOpen) return;
          if (e.key === "Enter") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="glass-card relative flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden p-7 text-center sm:p-9"
      >
        <OrgMark
          name={organization.name}
          logoUrl={organization.logoUrl}
          slug={organization.slug}
          size="xl"
        />

        <h2 className="font-heading mt-7 text-[clamp(1.5rem,3.5vw,1.85rem)] leading-[1.1] font-semibold text-balance text-[var(--ink)]">
          {organization.name}
        </h2>

        {location && (
          <p className="mt-1.5 text-[13px] tracking-wide text-[var(--ink-mute)]">
            {location}
          </p>
        )}

        {previewText && (
          <p className="mt-4 line-clamp-[7] max-w-[42ch] text-[14.5px] leading-[1.55] text-[var(--ink-soft)]">
            {previewText}
          </p>
        )}

        {keywords.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {keywords.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--rule)] bg-white/70 px-2.5 py-0.5 text-[10.5px] font-medium tracking-wide text-[var(--ink-soft)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Drag-direction edges */}
        <motion.span
          aria-hidden
          style={{ opacity: rightEdgeOpacity }}
          className="pointer-events-none absolute top-6 right-0 bottom-6 w-[2px] bg-[var(--accent)]"
        />
        <motion.span
          aria-hidden
          style={{ opacity: leftEdgeOpacity }}
          className="pointer-events-none absolute top-6 bottom-6 left-0 w-[2px] bg-[var(--rule-strong)]"
        />

        {/* Drag-direction labels */}
        <motion.span
          aria-hidden
          style={{ opacity: saveOpacity }}
          className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-[11px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase"
        >
          Save
        </motion.span>
        <motion.span
          aria-hidden
          style={{ opacity: skipOpacity }}
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[11px] font-semibold tracking-[0.28em] text-[var(--ink-mute)] uppercase"
        >
          Skip
        </motion.span>
      </article>
    </motion.div>
  );
}
