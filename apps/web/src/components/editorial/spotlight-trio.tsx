"use client";

import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { ArrowUpRight } from "lucide-react";
import { OrgMark } from "@/components/editorial/org-mark";
import { SectionHeader } from "@/components/editorial/section-header";
import { cn } from "@/lib/utils";

type Organization = Doc<"organizations">;

interface SpotlightTrioProps {
  picks: Organization[];
  onCardClick: (org: Organization) => void;
}

export function SpotlightTrio({ picks, onCardClick }: SpotlightTrioProps) {
  if (picks.length === 0) return null;

  const [first, ...rest] = picks;
  if (!first) return null;

  return (
    <section className="space-y-7">
      <SectionHeader
        kicker="Editor's picks"
        title={
          <>
            Worth a closer{" "}
            <span className="italic font-medium text-[var(--accent)]">look</span>{" "}
            this week.
          </>
        }
        subtitle="Three nonprofits surfaced from across our index — different scales, different missions, all worth a moment of attention."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <SpotlightLargeCard
          organization={first}
          onClick={() => onCardClick(first)}
        />
        <div className="flex flex-col gap-5 lg:col-span-5">
          {rest.slice(0, 2).map((pick, i) => (
            <SpotlightSmallCard
              key={pick._id}
              organization={pick}
              index={i + 2}
              onClick={() => onCardClick(pick)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightLargeCard({
  organization,
  onClick,
}: {
  organization: Organization;
  onClick: () => void;
}) {
  const lead =
    organization.tagline ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-[var(--rule)] bg-white p-8 shadow-[0_24px_60px_-36px_rgba(91,75,158,0.4)] transition-all duration-500 hover:border-[var(--accent)]/40 hover:shadow-[0_32px_80px_-30px_rgba(200,38,110,0.4)] lg:col-span-7 sm:p-10"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
          Pick<span className="font-mono normal-case tracking-tight">№01</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-[var(--ink-mute)] transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
      </div>

      <div className="mt-8 flex items-end gap-5">
        <OrgMark
          name={organization.name}
          logoUrl={organization.logoUrl}
          slug={organization.slug}
          size="lg"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.24em] text-[var(--ink-mute)] uppercase">
            <span className="truncate">{organization.city}</span>
            <span className="text-[var(--rule-strong)]">·</span>
            <span>{organization.state}</span>
          </div>
        </div>
      </div>

      <h3 className="font-heading mt-5 text-[clamp(1.5rem,2.4vw,2.1rem)] leading-[1.05] font-semibold text-[var(--ink)]">
        {organization.name}
      </h3>

      {lead && (
        <p className="mt-4 max-w-xl text-[15px] leading-[1.55] text-[var(--ink-soft)]">
          {lead}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
        {organization.keywords?.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[var(--ink-soft)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <span
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-px scale-x-0 origin-left bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent transition-transform duration-700 group-hover:scale-x-100"
      />
    </article>
  );
}

function SpotlightSmallCard({
  organization,
  index,
  onClick,
}: {
  organization: Organization;
  index: number;
  onClick: () => void;
}) {
  const lead =
    organization.tagline ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "glass-card group relative flex flex-1 cursor-pointer items-stretch gap-5 overflow-hidden p-5 sm:p-6",
      )}
    >
      <OrgMark
        name={organization.name}
        logoUrl={organization.logoUrl}
        slug={organization.slug}
        size="lg"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
            Pick №{String(index).padStart(2, "0")}
          </span>
          <ArrowUpRight className="h-4 w-4 text-[var(--ink-mute)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
        </div>

        <h3 className="font-heading mt-2 line-clamp-2 text-[18px] leading-[1.18] font-semibold text-[var(--ink)]">
          {organization.name}
        </h3>

        {lead && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.5] text-[var(--ink-soft)]">
            {lead}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
          <span className="truncate">{organization.city}</span>
          <span className="text-[var(--rule-strong)]">·</span>
          <span className="shrink-0">{organization.state}</span>
        </div>
      </div>
    </article>
  );
}

export function SpotlightTrioSkeleton() {
  return (
    <section className="space-y-7">
      <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-[var(--paper-deep)]" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="h-[360px] animate-pulse rounded-[2rem] bg-[var(--paper-deep)] lg:col-span-7" />
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="h-[170px] animate-pulse rounded-2xl bg-[var(--paper-deep)]" />
          <div className="h-[170px] animate-pulse rounded-2xl bg-[var(--paper-deep)]" />
        </div>
      </div>
    </section>
  );
}
