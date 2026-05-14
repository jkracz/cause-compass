"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import { OrgMark } from "@/components/editorial/org-mark";
import { cn } from "@/lib/utils";
import { sanitizeTagline } from "@cause/lib";
import { composeOrgByline } from "@/lib/org-byline";

type Organization = Doc<"organizations">;

interface FeaturedCausesProps {
  organizations: Organization[];
  onLearnMore: (org: Organization) => void;
}

const ROTATION_INTERVAL_MS = 6000;

export function FeaturedCauses({
  organizations,
  onLearnMore,
}: FeaturedCausesProps) {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likeOrganization = useMutation(api.users.likeOrganization);
  const unlikeOrganization = useMutation(api.users.unlikeOrganization);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (organizations.length <= 1 || isPaused) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % organizations.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [organizations.length, isPaused]);

  const safeIndex = activeIndex % Math.max(organizations.length, 1);
  const organization = organizations[safeIndex];
  if (!organization) return null;

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

  const goToIndex = (i: number) => {
    setActiveIndex(i);
    setIsPaused(true);
  };

  return (
    <section
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-[var(--accent)] uppercase">
              <Sparkles className="h-3 w-3" />
              Featured Causes
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={organization.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center gap-6">
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

            {organizations.length > 1 && (
              <div
                role="tablist"
                aria-label="Featured causes"
                className="flex items-center gap-2"
              >
                {organizations.map((org, i) => {
                  const isActive = i === safeIndex;
                  return (
                    <button
                      key={org.slug}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Show ${org.name}`}
                      onClick={() => goToIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        isActive
                          ? "w-8 bg-[var(--accent)]"
                          : "w-3 bg-[var(--ink)]/15 hover:bg-[var(--ink)]/30",
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={organization.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
              className="group relative cursor-pointer focus-visible:outline-none"
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
                    className={cn(
                      "h-4 w-4",
                      isLiked && "fill-[var(--accent)]",
                    )}
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
                      {byline.sentence}
                    </p>
                  ) : (
                    <p className="text-[10px] font-semibold tracking-[0.28em] text-[var(--ink-mute)] uppercase">
                      Featured this week
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export function FeaturedCausesSkeleton() {
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
