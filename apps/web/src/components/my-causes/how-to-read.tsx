"use client";

import { useId, useState } from "react";

import { FAMILY_COLOR } from "@/lib/compass-axes";

const FAMILY_BREAKDOWN: { name: string; includes: string[] }[] = [
  {
    name: "Imagination",
    includes: ["Arts & Culture", "Recreation & Sports"],
  },
  {
    name: "Knowledge",
    includes: [
      "Education & Learning",
      "Employment",
      "Youth Development",
      "Science & Technology",
      "Social Science",
    ],
  },
  {
    name: "Care",
    includes: [
      "Health Care",
      "Mental Health",
      "Disease & Medical Research",
      "Crime & Legal",
      "Housing & Shelter",
      "Public Safety",
      "Human Services",
      "International Affairs",
      "Civil Rights",
    ],
  },
  {
    name: "Stewardship",
    includes: [
      "Environment",
      "Animal-Related",
      "Food & Agriculture",
      "Community Improvement",
      "Public & Society Benefit",
    ],
  },
  {
    name: "Center",
    includes: [
      "Philanthropy & Voluntarism",
      "Religion-Related",
      "Mutual & Membership Benefit",
      "Unknown",
    ],
  },
];

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
          <div
            className={`mt-3 space-y-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            <div>
              <div className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                Direction
              </div>
              <p className="mt-0.5 text-[var(--ink-soft)]">
                Which family of causes the org belongs to.
              </p>
              <dl className="mt-2 space-y-1.5">
                {FAMILY_BREAKDOWN.map((fam) => {
                  const color =
                    fam.name === "Center"
                      ? FAMILY_COLOR.Unclassified
                      : FAMILY_COLOR[
                          fam.name as keyof typeof FAMILY_COLOR
                        ];
                  return (
                    <div
                      key={fam.name}
                      className="flex items-baseline gap-2"
                    >
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full"
                        style={{ background: color }}
                      />
                      <dt className="shrink-0 text-[12.5px] font-semibold text-[var(--ink)]">
                        {fam.name}
                      </dt>
                      <dd className="text-[12px] text-[var(--ink-mute)]">
                        {fam.includes.join(", ")}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <dl className="grid gap-3 md:grid-cols-2">
              <div>
                <dt className="font-heading text-[13px] font-semibold text-[var(--ink)]">
                  Distance from center
                </dt>
                <dd className="mt-0.5 text-[var(--ink-soft)]">
                  How far the org&apos;s work reaches. Closer in means one
                  neighborhood or city; further out means across the country
                  or the world.
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
    </div>
  );
}
