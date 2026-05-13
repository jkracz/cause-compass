"use client";

import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { SectionHeader } from "@/components/editorial/section-header";
import { CompactOrgCard } from "@/components/editorial/compact-org-card";

type Organization = Doc<"organizations">;

interface ScaleStripProps {
  data: {
    small: Organization[];
    medium: Organization[];
    large: Organization[];
  };
  onCardClick: (org: Organization) => void;
}

const COLUMNS: {
  key: "small" | "medium" | "large";
  label: string;
  caption: string;
  hint: string;
  glyph: string;
}[] = [
  {
    key: "small",
    label: "Grassroots",
    caption: "Under $250K assets",
    hint: "Lean teams, neighborhood reach, every dollar a needle-mover.",
    glyph: "·",
  },
  {
    key: "medium",
    label: "Established",
    caption: "$250K – $1M assets",
    hint: "Past the founding crunch. Real programs, real proof, room to grow.",
    glyph: "◇",
  },
  {
    key: "large",
    label: "Institutional",
    caption: "$1M+ assets",
    hint: "Recognizable names, deep playbooks, capacity to move at scale.",
    glyph: "◈",
  },
];

export function ScaleStrip({ data, onCardClick }: ScaleStripProps) {
  const hasAny = data.small.length + data.medium.length + data.large.length > 0;
  if (!hasAny) return null;

  return (
    <section className="space-y-7">
      <SectionHeader
        title={
          <>
            Where do you{" "}
            <span className="font-medium text-[var(--accent)] italic">
              show up
            </span>{" "}
            best?
          </>
        }
        subtitle="Different sized nonprofits ask for different kinds of help. Pick the bracket that matches what you can actually give."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {COLUMNS.map((column) => (
          <ScaleColumn
            key={column.key}
            column={column}
            organizations={data[column.key]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </section>
  );
}

function ScaleColumn({
  column,
  organizations,
  onCardClick,
}: {
  column: (typeof COLUMNS)[number];
  organizations: Organization[];
  onCardClick: (org: Organization) => void;
}) {
  return (
    <div className="relative flex flex-col gap-4 rounded-[1.5rem] border border-[var(--rule)] bg-white/50 p-5 backdrop-blur md:p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
            {column.caption}
          </p>
          <h3 className="font-heading mt-1 text-[24px] leading-none font-semibold text-[var(--ink)]">
            {column.label}
          </h3>
        </div>
        <span
          className="font-heading text-[2rem] leading-none text-[var(--accent-2)]/40"
          aria-hidden
        >
          {column.glyph}
        </span>
      </div>
      <p className="text-[12.5px] leading-[1.5] text-[var(--ink-soft)]">
        {column.hint}
      </p>

      <div
        className="mt-1 h-px bg-gradient-to-r from-[var(--rule-strong)] via-[var(--rule)] to-transparent"
        aria-hidden
      />

      <ol className="flex flex-col gap-2.5">
        {organizations.length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--rule)] px-3 py-6 text-center text-[12px] text-[var(--ink-mute)]">
            No matches at this scale right now.
          </li>
        )}
        {organizations.map((org, i) => (
          <li key={org._id}>
            <CompactOrgCard
              organization={org}
              index={i}
              onClick={() => onCardClick(org)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ScaleStripSkeleton() {
  return (
    <section className="space-y-7">
      <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-[var(--paper-deep)]" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[420px] animate-pulse rounded-[1.5rem] bg-[var(--paper-deep)]"
          />
        ))}
      </div>
    </section>
  );
}
