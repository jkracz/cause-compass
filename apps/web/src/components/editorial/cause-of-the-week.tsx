"use client";

import { Heart, ArrowUpRight, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import { OrgMark } from "@/components/editorial/org-mark";
import { cn } from "@/lib/utils";

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

  const handleLikeToggle = async () => {
    if (isLiked) {
      await unlikeOrganization({ guestId, organizationId: organization.slug });
    } else {
      await likeOrganization({ guestId, organizationId: organization.slug });
    }
  };

  const lead =
    organization.tagline ||
    organization.oneSentenceSummary ||
    organization.whySupport;

  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <svg
          className="absolute -top-12 left-1/2 h-[140%] w-[140%] -translate-x-1/2 text-[var(--accent-2)]/10"
          viewBox="0 0 1200 800"
          fill="none"
          aria-hidden
        >
          <defs>
            <pattern
              id="topo"
              width="180"
              height="180"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 90 Q 45 30 90 90 T 180 90"
                stroke="currentColor"
                strokeWidth="0.6"
                fill="none"
              />
              <path
                d="M0 130 Q 45 70 90 130 T 180 130"
                stroke="currentColor"
                strokeWidth="0.6"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>
      </div>

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
              <Sparkles className="h-3 w-3" />
              Cause of the Week
            </span>
            {organization.geographicFocus && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-white/70 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-[var(--ink-soft)] uppercase">
                {organization.geographicFocus} reach
              </span>
            )}
          </div>

          <h1 className="font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-tight text-[var(--ink)]">
            {organization.name}
          </h1>

          {lead && (
            <p className="mt-6 max-w-xl border-l-2 border-[var(--accent)]/70 pl-5 font-heading text-[clamp(1.05rem,1.5vw,1.35rem)] leading-[1.45] font-medium italic text-[var(--ink-soft)]">
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

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onLearnMore(organization)}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[13px] font-semibold tracking-wide text-[var(--paper)] transition-all hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]"
            >
              Read the full story
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => void handleLikeToggle()}
              aria-pressed={isLiked}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[13px] font-semibold tracking-wide transition-all",
                isLiked
                  ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--rule-strong)] bg-white/70 text-[var(--ink-soft)] hover:border-[var(--accent)]/40 hover:bg-white hover:text-[var(--accent)]",
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform",
                  isLiked && "fill-[var(--accent)]",
                )}
              />
              {isLiked ? "Saved to My Causes" : "Add to My Causes"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative">
            {/* paper layer card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--rule)] bg-white p-8 shadow-[0_30px_70px_-40px_rgba(91,75,158,0.45)]">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent"
              />
              <div className="mb-5 flex items-center justify-between text-[10px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
                <span>Featured</span>
                <span className="font-mono normal-case tracking-[0.1em]">
                  Vol. 01 · No. {String(new Date().getUTCDate()).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-col items-center gap-6 text-center">
                <OrgMark
                  name={organization.name}
                  logoUrl={organization.logoUrl}
                  slug={organization.slug}
                  size="xl"
                />
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--ink-mute)] uppercase">
                    Currently serving
                  </p>
                  <p className="font-heading mt-1 text-[18px] font-semibold text-[var(--ink)]">
                    {organization.city}
                    {organization.state && (
                      <>
                        <span className="mx-1.5 text-[var(--rule-strong)]">·</span>
                        <span>{organization.state}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--rule)] pt-5 text-center text-[11px] font-medium text-[var(--ink-soft)]">
                <Stat label="Focus" value={organization.geographicFocus ?? "—"} />
                <Stat
                  label="Scale"
                  value={SIZE_SHORT[organization.assetBucket] ?? "—"}
                />
                <Stat
                  label="Tags"
                  value={String(organization.keywords?.length ?? 0)}
                />
              </div>

              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--rule-strong)] to-transparent"
              />
            </div>

            <span
              aria-hidden
              className="absolute -top-3 -left-3 hidden h-20 w-20 rounded-full bg-[var(--accent-soft)] mix-blend-multiply blur-2xl lg:block"
            />
            <span
              aria-hidden
              className="absolute -right-4 -bottom-4 hidden h-24 w-24 rounded-full bg-[var(--accent-2)]/30 mix-blend-multiply blur-2xl lg:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const SIZE_SHORT: Record<string, string> = {
  micro: "Grassroots",
  small: "Small",
  mid: "Mid",
  large: "Large",
  mega: "Major",
  unknown: "—",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-semibold tracking-[0.24em] text-[var(--ink-mute)] uppercase">
        {label}
      </div>
      <div className="font-heading mt-0.5 text-[14px] font-semibold text-[var(--ink)]">
        {value}
      </div>
    </div>
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
