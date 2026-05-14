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
}[] = [
  {
    key: "small",
    label: "Grassroots",
    caption: "Under $250K assets",
    hint: "Small teams close to the work, where modest help can be felt quickly.",
  },
  {
    key: "medium",
    label: "Established",
    caption: "$250K – $1M assets",
    hint: "Proven programs with room for more people, funding, and attention.",
  },
  {
    key: "large",
    label: "Institutional",
    caption: "$1M+ assets",
    hint: "Larger organizations with the staff and systems to work at scale.",
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
            What size cause{" "}
            <span className="font-medium text-[var(--accent)] italic">
              fits
            </span>{" "}
            you?
          </>
        }
        subtitle="Browse by organization size, from small teams to larger institutions with more resources."
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
      <div>
        <p className="text-[10px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
          {column.caption}
        </p>
        <h3 className="font-heading mt-1 text-[24px] leading-none font-semibold text-[var(--ink)]">
          {column.label}
        </h3>
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
