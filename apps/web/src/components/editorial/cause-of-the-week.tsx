"use client";

import type React from "react";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import { OrgMark } from "@/components/editorial/org-mark";
import { cn } from "@/lib/utils";
import { sanitizeTagline } from "@cause/lib";
import { composeOrgByline } from "@/lib/org-byline";

type Organization = Doc<"organizations">;

interface CauseOfTheWeekProps {
  organization: Organization;
  onLearnMore: (org: Organization) => void;
}

export function CauseOfTheWeek({
  organization,
  onLearnMore,
}: CauseOfTheWeekProps) {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likeOrganization = useMutation(api.users.likeOrganization);
  const unlikeOrganization = useMutation(api.users.unlikeOrganization);

  const isLiked =
    viewer?.likedOrganizations?.includes(organization.slug) ?? false;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      await unlikeOrganization({ guestId, organizationId: organization.slug });
    } else {
      await likeOrganization({ guestId, organizationId: organization.slug });
    }
  };

  const openLearnMore = () => onLearnMore(organization);

  const lead =
    sanitizeTagline(organization.tagline) ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  const byline = composeOrgByline({
    assetBucket: organization.assetBucket,
    geographicFocus: organization.geographicFocus,
    city: organization.city,
    state: organization.state,
  });

  return (
    <section className="relative">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
              <Sparkles className="h-3 w-3" />
              Cause of the Week
            </span>
          </div>

          <h1 className="font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-tight text-[var(--ink)]">
            {organization.name}
          </h1>

          {lead && (
            <p className="font-heading mt-6 max-w-xl border-l-2 border-[var(--accent)]/70 pl-5 text-[clamp(1.05rem,1.5vw,1.35rem)] leading-[1.45] font-medium text-[var(--ink-soft)] italic">
              “{lead}”
            </p>
          )}

          {organization.keywords && organization.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {organization.keywords.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--rule)] bg-white/60 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--ink-soft)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={openLearnMore}
              className="group inline-flex items-center gap-2 text-[14px] font-semibold tracking-wide text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
            >
              <span className="border-b border-[var(--ink)]/30 pb-0.5 transition-colors group-hover:border-[var(--accent)]">
                Learn more
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div
            role="button"
            tabIndex={0}
            onClick={openLearnMore}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLearnMore();
              }
            }}
            aria-label={`Learn more about ${organization.name}`}
            className="group relative cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none"
          >
            <div className="glass-card relative overflow-hidden !rounded-[2rem] p-8 shadow-[0_30px_70px_-40px_rgba(91,75,158,0.45)] transition-shadow duration-300 ease-out group-hover:shadow-[0_22px_50px_-28px_rgba(91,75,158,0.55)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent)]/50 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--paper)]">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent"
              />

              <button
                type="button"
                onClick={(e) => void handleLikeToggle(e)}
                aria-pressed={isLiked}
                aria-label={
                  isLiked ? "Remove from My Causes" : "Add to My Causes"
                }
                className={cn(
                  "absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white/85 transition-all duration-200 hover:scale-105",
                  isLiked
                    ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--rule)] text-[var(--ink-mute)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]",
                )}
              >
                <Heart
                  className={cn("h-4 w-4", isLiked && "fill-[var(--accent)]")}
                />
              </button>

              <div className="flex flex-col items-center gap-7 text-center">
                <OrgMark
                  name={organization.name}
                  logoUrl={organization.logoUrl}
                  slug={organization.slug}
                  size="xl"
                />

                {byline ? (
                  <p className="font-heading max-w-[28ch] text-[clamp(0.95rem,1.15vw,1.05rem)] leading-[1.5] text-[var(--ink-soft)] italic">
                    {byline.glyph && (
                      <span
                        aria-hidden
                        className="mr-2 text-[var(--accent-2)] not-italic"
                      >
                        {byline.glyph}
                      </span>
                    )}
                    {byline.sentence}
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--ink-mute)] uppercase">
                    Featured this week
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CauseOfTheWeekSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <div className="h-7 w-48 animate-pulse rounded-full bg-[var(--paper-deep)]" />
        <div className="mt-6 h-20 w-full animate-pulse rounded-2xl bg-[var(--paper-deep)]" />
        <div className="mt-4 h-12 w-3/4 animate-pulse rounded-xl bg-[var(--paper-deep)]" />
      </div>
      <div className="lg:col-span-5">
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-[var(--paper-deep)]" />
      </div>
    </section>
  );
}
