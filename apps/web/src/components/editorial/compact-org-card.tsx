"use client";

import type React from "react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { OrgMark } from "@/components/editorial/org-mark";
import { cn } from "@/lib/utils";

type Organization = Doc<"organizations">;

interface CompactOrgCardProps {
  organization: Organization;
  onClick: () => void;
  index?: number;
  className?: string;
}

export function CompactOrgCard({
  organization,
  onClick,
  index,
  className,
}: CompactOrgCardProps) {
  const subtitle =
    organization.tagline ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "glass-card-compact group flex w-full cursor-pointer items-start gap-3 px-3.5 py-3 text-left",
        className,
      )}
    >
      <OrgMark
        name={organization.name}
        logoUrl={organization.logoUrl}
        slug={organization.slug}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {index !== undefined && (
            <span className="font-heading text-[12px] font-semibold tracking-tight text-[var(--ink-mute)] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <h4 className="font-heading line-clamp-1 text-[15px] font-semibold leading-[1.2] text-[var(--ink)] group-hover:text-[var(--accent)]">
            {organization.name}
          </h4>
        </div>
        {subtitle && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-[1.45] text-[var(--ink-soft)]">
            {subtitle}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--ink-mute)] uppercase">
          <span className="truncate">{organization.city}</span>
          {organization.state && (
            <>
              <span className="text-[var(--rule-strong)]">·</span>
              <span className="shrink-0">{organization.state}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
