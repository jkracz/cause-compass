"use client";

import type React from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import { OrgMark } from "@/components/editorial/org-mark";
import { cn } from "@/lib/utils";
import { sanitizeTagline } from "@cause/types";

type Organization = Doc<"organizations">;

interface EditorialOrgCardProps {
  organization: Organization;
  onClick: () => void;
  variant?: "default" | "tall";
  className?: string;
}

const GEO_GLYPH: Record<string, string> = {
  Global: "◐",
  National: "◈",
  Regional: "◇",
  Local: "◉",
};

export function EditorialOrgCard({
  organization,
  onClick,
  variant = "default",
  className,
}: EditorialOrgCardProps) {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likeOrganization = useMutation(api.users.likeOrganization);
  const unlikeOrganization = useMutation(api.users.unlikeOrganization);

  const isLiked =
    viewer?.likedOrganizations?.includes(organization.slug) ?? false;

  const previewText =
    sanitizeTagline(organization.tagline) ||
    organization.oneSentenceSummary ||
    organization.whySupport ||
    organization.mission;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      await unlikeOrganization({ guestId, organizationId: organization.slug });
    } else {
      await likeOrganization({ guestId, organizationId: organization.slug });
    }
  };

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
        "glass-card group relative flex h-full cursor-pointer flex-col overflow-hidden",
        variant === "tall" ? "min-h-[360px]" : "min-h-[280px]",
        className,
      )}
    >
      {/* sweep highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 transition-all duration-1000 ease-out group-hover:translate-x-[110%] group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3 p-4 pb-2">
        <OrgMark
          name={organization.name}
          logoUrl={organization.logoUrl}
          slug={organization.slug}
          size={variant === "tall" ? "lg" : "md"}
        />

        <button
          type="button"
          aria-label={isLiked ? "Remove from My Causes" : "Add to My Causes"}
          onClick={(e) => void handleLikeToggle(e)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border bg-white/85 transition-all duration-200 hover:scale-105",
            isLiked
              ? "border-[var(--accent)]/40 text-[var(--accent)]"
              : "border-[var(--rule)] text-[var(--ink-mute)] opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isLiked && "fill-[var(--accent)]",
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 pt-1 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
          <span className="h-px w-3 shrink-0 bg-[var(--rule-strong)]" />
          <span className="truncate">{organization.city}</span>
          {organization.state && (
            <>
              <span className="text-[var(--rule-strong)]">·</span>
              <span className="shrink-0">{organization.state}</span>
            </>
          )}
          {organization.geographicFocus && (
            <>
              <span className="text-[var(--rule-strong)]">·</span>
              <span className="flex shrink-0 items-center gap-1 text-[var(--accent-2)]">
                <span aria-hidden>
                  {GEO_GLYPH[organization.geographicFocus]}
                </span>
                {organization.geographicFocus}
              </span>
            </>
          )}
        </div>

        <h3
          className={cn(
            "font-heading line-clamp-2 leading-[1.18] font-semibold text-[var(--ink)]",
            variant === "tall" ? "text-[22px]" : "text-[18px]",
          )}
        >
          {organization.name}
        </h3>

        {previewText && (
          <p
            className={cn(
              "leading-[1.5] text-[var(--ink-soft)]",
              variant === "tall"
                ? "line-clamp-4 text-[14px]"
                : "line-clamp-3 text-[13px]",
            )}
          >
            {previewText}
          </p>
        )}

        {organization.keywords && organization.keywords.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
            {organization.keywords.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--rule)] bg-white/60 px-2.5 py-0.5 text-[10.5px] font-medium tracking-wide text-[var(--ink-soft)]"
              >
                {tag}
              </span>
            ))}
            {organization.keywords.length > 3 && (
              <span className="text-[10.5px] font-medium tracking-wide text-[var(--ink-mute)]">
                +{organization.keywords.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <span
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />
    </article>
  );
}
