"use client";

import { useId, useState } from "react";

export function HowToReadDisclosure() {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="mt-3 text-[12.5px] leading-[1.55] text-[var(--ink-soft)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase outline-none transition-colors hover:text-[var(--ink)] focus-visible:text-[var(--ink)]"
      >
        How to read this
        <span
          aria-hidden
          className={`inline-block transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <dl
            className={`mt-3 grid gap-3 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none md:grid-cols-3 ${
              open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            <div>
              <dt className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                Direction
              </dt>
              <dd className="mt-0.5 text-[var(--ink-soft)]">
                Which family of causes the org belongs to. The four cardinals
                cover most of it; diagonals catch global affairs, community,
                public safety, and youth.
              </dd>
            </div>
            <div>
              <dt className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                Distance from center
              </dt>
              <dd className="mt-0.5 text-[var(--ink-soft)]">
                How far the org&apos;s work reaches. Closer in means one
                neighborhood or city; further out means across the country or
                the world.
              </dd>
            </div>
            <div>
              <dt className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                Dot size
              </dt>
              <dd className="mt-0.5 text-[var(--ink-soft)]">
                The org&apos;s scale, by annual assets. Small dots are
                grassroots; medium dots are established; large dots are
                institutional.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
