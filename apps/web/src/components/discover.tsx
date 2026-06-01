"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";

import { SwipeableCard } from "@/components/swipeable-card";
import { DynamicOrganizationModal } from "@/components/dynamic-organization-modal";
import { DiscoverSkeleton } from "@/app/discover/discover-skeleton";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import {
  RECOMMENDATION_VERSION,
  RecommendationResult,
} from "@/lib/recommendations";
import { analytics } from "@/lib/analytics-client";
import { useLocationPreference } from "@/components/location-preference-provider";

export default function Discover() {
  const { guestId } = useAppSession();
  const locationPreference = useLocationPreference();
  const preferredState = locationPreference.activeState?.stateCode;
  const [sessionSeed] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()),
  );
  const recommendations = useQuery(
    api.organizations.getPersonalizedRecommended,
    guestId
      ? { guestId, limit: 10, sessionSeed, preferredState }
      : { limit: 10, sessionSeed, preferredState },
  );
  const likeOrganization = useMutation(api.users.likeOrganization);
  const dismissOrganization = useMutation(api.users.dismissOrganization);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [sessionRecommendations, setSessionRecommendations] = useState<
    RecommendationResult[] | null
  >(null);
  const hasTrackedCompletionRef = useRef(false);
  const trackedImpressionsRef = useRef<Set<string>>(new Set());
  const [detailsOrgSlug, setDetailsOrgSlug] = useState<string | null>(null);

  useEffect(() => {
    startTransition(() => {
      setSessionRecommendations(null);
      setCurrentIndex(0);
      setLikedCount(0);
      setDetailsOrgSlug(null);
      hasTrackedCompletionRef.current = false;
      trackedImpressionsRef.current.clear();
    });
  }, [preferredState]);

  useEffect(() => {
    if (recommendations !== undefined && sessionRecommendations === null) {
      startTransition(() => {
        setSessionRecommendations(recommendations);
      });
    }
  }, [recommendations, sessionRecommendations]);

  const activeRecommendations = sessionRecommendations;
  const activeRecommendationCount = activeRecommendations?.length ?? 0;
  const isFinished = activeRecommendations
    ? currentIndex >= activeRecommendationCount
    : false;

  useEffect(() => {
    if (!activeRecommendations) {
      return;
    }

    const currentRecommendation = activeRecommendations[currentIndex];
    if (!currentRecommendation) {
      return;
    }

    if (
      trackedImpressionsRef.current.has(currentRecommendation.organization.slug)
    ) {
      return;
    }

    trackedImpressionsRef.current.add(currentRecommendation.organization.slug);
    analytics.capture("recommendation_impression", {
      organization_id: currentRecommendation.organization.slug,
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
      position_in_ranked_feed: currentIndex,
    });
  }, [activeRecommendations, currentIndex]);

  useEffect(() => {
    if (
      activeRecommendations &&
      activeRecommendations.length > 0 &&
      isFinished &&
      !hasTrackedCompletionRef.current
    ) {
      hasTrackedCompletionRef.current = true;
      analytics.capture("discovery_session_completed", {
        total_causes_shown: activeRecommendations.length,
        total_liked: likedCount,
        total_skipped: activeRecommendations.length - likedCount,
        like_rate:
          activeRecommendations.length > 0
            ? likedCount / activeRecommendations.length
            : 0,
        recommendation_version: RECOMMENDATION_VERSION,
      });
    }
  }, [activeRecommendations, isFinished, likedCount]);

  const currentRecommendation = activeRecommendations?.[currentIndex];
  const peekRecommendation = activeRecommendations?.[currentIndex + 1];

  const handleLike = useCallback(async () => {
    if (!currentRecommendation) {
      return;
    }

    await likeOrganization({
      guestId,
      organizationId: currentRecommendation.organization.slug,
    });

    setLikedCount((count) => count + 1);

    analytics.capture("organization_liked", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      organization_city: currentRecommendation.organization.city,
      organization_state: currentRecommendation.organization.state,
      position_in_stack: currentIndex,
      total_causes: activeRecommendations?.length ?? 0,
      total_liked_so_far: likedCount + 1,
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
      why_this_match: currentRecommendation.whyThisMatch,
      position_in_ranked_feed: currentIndex,
    });

    setCurrentIndex((index) => index + 1);
  }, [
    activeRecommendations,
    currentIndex,
    currentRecommendation,
    guestId,
    likeOrganization,
    likedCount,
  ]);

  const handleSkip = useCallback(async () => {
    if (!currentRecommendation) {
      return;
    }

    try {
      await dismissOrganization({
        guestId,
        organizationId: currentRecommendation.organization.slug,
      });
    } catch (error) {
      console.error("Error dismissing organization:", error);
      analytics.captureException(error);
    }

    analytics.capture("organization_skipped", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      position_in_stack: currentIndex,
      total_causes: activeRecommendations?.length ?? 0,
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
      why_this_match: currentRecommendation.whyThisMatch,
      position_in_ranked_feed: currentIndex,
    });

    setCurrentIndex((index) => index + 1);
  }, [
    activeRecommendations,
    currentIndex,
    currentRecommendation,
    dismissOrganization,
    guestId,
  ]);

  const handleViewMyCauses = () => {
    router.push("/my-causes");
  };

  const handleBrowseByCause = () => {
    router.push("/");
  };

  const handleOpenDetails = useCallback(() => {
    if (!currentRecommendation) return;
    setDetailsOrgSlug(currentRecommendation.organization.slug);
    analytics.capture("organization_details_viewed", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      organization_city: currentRecommendation.organization.city,
      organization_state: currentRecommendation.organization.state,
      source: "discover_swipe",
      position_in_stack: currentIndex,
      recommendation_version: RECOMMENDATION_VERSION,
    });
  }, [currentIndex, currentRecommendation]);

  const handleCloseDetails = () => setDetailsOrgSlug(null);

  const detailsOrg =
    detailsOrgSlug &&
    currentRecommendation?.organization.slug === detailsOrgSlug
      ? currentRecommendation.organization
      : null;

  // Keyboard shortcuts: ← turn, → clip
  useEffect(() => {
    if (!currentRecommendation) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        void handleLike();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        void handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentRecommendation, handleLike, handleSkip]);

  if (!activeRecommendations) {
    return <DiscoverSkeleton />;
  }

  const hasNoRecommendations = activeRecommendations.length === 0;
  const total = activeRecommendations.length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Atmospheric blush halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh]"
      >
        <div className="absolute -top-40 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-50 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-6 pb-10 sm:px-8 sm:pt-8">
        {hasNoRecommendations ? (
          <EmptyState onBrowse={handleBrowseByCause} />
        ) : isFinished ? (
          <FinishedState
            likedCount={likedCount}
            onOpenNotebook={handleViewMyCauses}
            onBrowse={handleBrowseByCause}
          />
        ) : (
          <>
            <DiscoverHeader total={total} currentIndex={currentIndex} />

            <div className="relative mx-auto mt-5 mb-6 h-[520px] w-full max-w-md sm:h-[560px]">
              {/* Paper card peeking behind */}
              {peekRecommendation && (
                <div
                  aria-hidden
                  className="absolute inset-x-3 top-3 bottom-[-6px] rounded-[1.25rem] border border-[var(--rule)] bg-white/65"
                  style={{ zIndex: 1 }}
                />
              )}

              {/* Active loupe card */}
              <AnimatePresence mode="popLayout" initial={false}>
                {currentRecommendation && (
                  <motion.div
                    key={currentRecommendation.organization.slug}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ zIndex: 2 }}
                  >
                    <SwipeableCard
                      organization={currentRecommendation.organization}
                      onSwipeLeft={() => void handleSkip()}
                      onSwipeRight={() => void handleLike()}
                      onOpen={handleOpenDetails}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={() => void handleSkip()}
                  className="order-2 inline-flex items-center justify-center rounded-full border border-[var(--rule-strong)] bg-white/70 px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--ink-soft)] uppercase transition-colors duration-200 ease-out hover:border-[var(--accent)]/45 hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:order-1"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => void handleLike()}
                  className="order-1 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--paper)] uppercase shadow-[0_10px_24px_-18px_rgba(26,15,44,0.55)] transition-all duration-200 ease-out hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:order-2"
                >
                  Add to my causes
                </button>
              </div>

              <div className="flex h-6 items-center justify-center">
                {likedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleViewMyCauses}
                    className="text-[12px] tracking-[0.04em] text-[var(--ink-mute)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-[6px] transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]/60"
                  >
                    View my causes
                    <span aria-hidden> →</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {detailsOrg && (
        <DynamicOrganizationModal
          organization={detailsOrg}
          isOpen={Boolean(detailsOrgSlug)}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}

function DiscoverHeader({
  total,
  currentIndex,
}: {
  total: number;
  currentIndex: number;
}) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <h1 className="font-heading text-[clamp(1.5rem,4vw,2rem)] leading-[1.1] font-semibold text-balance text-[var(--ink)]">
        A few causes to wander through
      </h1>
      <ProgressStrip total={total} currentIndex={currentIndex} />
      <p className="text-[12px] leading-none tracking-[0.04em] text-[var(--ink-mute)]">
        Swipe right to add to your causes. Left to skip. Tap to learn more.
      </p>
    </header>
  );
}

function ProgressStrip({
  total,
  currentIndex,
}: {
  total: number;
  currentIndex: number;
}) {
  return (
    <div
      className="mt-2 flex w-full max-w-[280px] items-center gap-1.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(currentIndex, total)}
      aria-label={`Page ${Math.min(currentIndex + 1, total)} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "active" : "future";
        return (
          <span
            key={i}
            aria-hidden
            className={
              "h-[3px] flex-1 rounded-full transition-colors duration-300 ease-out " +
              (state === "done"
                ? "bg-[var(--ink-mute)]"
                : state === "active"
                  ? "bg-[var(--accent)]"
                  : "bg-[var(--rule)]")
            }
          />
        );
      })}
    </div>
  );
}

function FinishedState({
  likedCount,
  onOpenNotebook,
  onBrowse,
}: {
  likedCount: number;
  onOpenNotebook: () => void;
  onBrowse: () => void;
}) {
  const headline =
    likedCount === 0 ? "Nothing saved today." : "You're all caught up.";
  const body =
    likedCount === 0
      ? "Come back tomorrow for a fresh set, or browse by cause to find one now."
      : `You added ${likedCount} ${likedCount === 1 ? "cause" : "causes"} to your collection. Come back tomorrow for a fresh set.`;

  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <article className="w-full max-w-md rounded-[1.5rem] border border-[var(--rule)] bg-white/85 p-9 shadow-[0_24px_50px_-40px_rgba(91,75,158,0.4)]">
        <h2 className="font-heading text-[clamp(1.65rem,3.5vw,2rem)] leading-[1.08] font-semibold text-balance text-[var(--ink)]">
          {headline}
        </h2>
        <p className="mt-4 text-[15px] leading-[1.55] text-[var(--ink-soft)]">
          {body}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {likedCount > 0 && (
            <button
              type="button"
              onClick={onOpenNotebook}
              className="inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--paper)] uppercase transition-all duration-200 ease-out hover:bg-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
            >
              View my causes
            </button>
          )}
          <button
            type="button"
            onClick={onBrowse}
            className="inline-flex items-center justify-center rounded-full border border-[var(--rule-strong)] bg-white/70 px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--ink-soft)] uppercase transition-colors duration-200 ease-out hover:border-[var(--accent)]/45 hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
          >
            Browse by cause
          </button>
        </div>
      </article>
    </section>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <article className="w-full max-w-md rounded-[1.5rem] border border-[var(--rule)] bg-white/85 p-9">
        <h2 className="font-heading text-[clamp(1.65rem,3.5vw,2rem)] leading-[1.08] font-semibold text-balance text-[var(--ink)]">
          No causes to show right now.
        </h2>
        <p className="mt-4 text-[15px] leading-[1.55] text-[var(--ink-soft)]">
          We couldn&apos;t put together a set for you right now. Try browsing by
          cause and we&apos;ll find a few more tomorrow.
        </p>
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={onBrowse}
            className="inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--paper)] uppercase transition-all duration-200 ease-out hover:bg-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
          >
            Browse by cause
          </button>
        </div>
      </article>
    </section>
  );
}
