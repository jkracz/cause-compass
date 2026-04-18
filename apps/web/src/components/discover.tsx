"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import { motion } from "motion/react";
import posthog from "posthog-js";
import { useMutation, useQuery } from "convex/react";

import { SwipeableCard } from "@/components/swipeable-card";
import { Button } from "@/components/ui/button";
import { OrganizationModal } from "@/components/organization-modal";
import { DiscoverSkeleton } from "@/app/discover/discover-skeleton";
import type { SessionLocation } from "@/app/discover/actions";
import { reverseGeocodeForSession } from "@/app/discover/actions";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import {
  RECOMMENDATION_VERSION,
  RecommendationResult,
} from "@/lib/recommendations";

type StoredCoordinates = {
  latitude: number;
  longitude: number;
};

function parseStoredCoordinates(location?: string): StoredCoordinates | null {
  if (!location?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(location) as {
      latitude?: unknown;
      longitude?: unknown;
    };

    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export default function Discover() {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const [sessionSeed] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()),
  );
  const [sessionLocation, setSessionLocation] = useState<SessionLocation | null>(
    null,
  );
  const [sessionLocationResolved, setSessionLocationResolved] = useState(false);
  const recommendations = useQuery(
    api.organizations.getPersonalizedRecommended,
    sessionLocationResolved
      ? guestId
        ? {
            guestId,
            limit: 10,
            sessionLocationState: sessionLocation?.state,
            sessionSeed,
          }
        : {
            limit: 10,
            sessionLocationState: sessionLocation?.state,
            sessionSeed,
          }
      : "skip",
  );
  const likeOrganization = useMutation(api.users.likeOrganization);
  const dismissOrganization = useMutation(api.users.dismissOrganization);
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [sessionRecommendations, setSessionRecommendations] = useState<
    RecommendationResult[] | null
  >(null);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<RecommendationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasTrackedCompletionRef = useRef(false);
  const trackedImpressionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (viewer === undefined || sessionLocationResolved) {
      return;
    }

    const storedLocation = viewer?.preferences.location;
    if (
      !storedLocation ||
      storedLocation === "skipped" ||
      storedLocation === "denied" ||
      storedLocation === "unavailable"
    ) {
      startTransition(() => {
        setSessionLocationResolved(true);
      });
      return;
    }

    const resolveSessionLocation = async () => {
      try {
        const storedCoordinates = parseStoredCoordinates(storedLocation);
        let coordinates = storedCoordinates;

        if (!coordinates && storedLocation === "granted") {
          coordinates = await new Promise<StoredCoordinates>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              (position) =>
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }),
              reject,
              {
                timeout: 10000,
                enableHighAccuracy: true,
              },
            ),
          );
        }

        if (!coordinates) {
          startTransition(() => {
            setSessionLocationResolved(true);
          });
          return;
        }

        const location = await reverseGeocodeForSession(coordinates);
        if (!location) {
          startTransition(() => {
            setSessionLocationResolved(true);
          });
          return;
        }

        setSessionLocation(location);
      } catch (error) {
        console.error("Error resolving session location:", error);
        posthog.captureException(error);
      } finally {
        setSessionLocationResolved(true);
      }
    };

    void resolveSessionLocation();
  }, [sessionLocationResolved, viewer]);

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
    posthog.capture("recommendation_impression", {
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
      posthog.capture("discovery_session_completed", {
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

  if (!activeRecommendations) {
    return <DiscoverSkeleton />;
  }

  const currentRecommendation = activeRecommendations[currentIndex];
  const hasNoRecommendations = activeRecommendations.length === 0;

  const handleLike = async () => {
    if (!currentRecommendation) {
      return;
    }

    await likeOrganization({
      guestId,
      organizationId: currentRecommendation.organization.slug,
    });

    setLikedCount((count) => count + 1);

    posthog.capture("organization_liked", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      organization_city: currentRecommendation.organization.city,
      organization_state: currentRecommendation.organization.state,
      position_in_stack: currentIndex,
      total_causes: activeRecommendations.length,
      total_liked_so_far: likedCount + 1,
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
      why_this_match: currentRecommendation.whyThisMatch,
      position_in_ranked_feed: currentIndex,
    });

    setCurrentIndex((index) => index + 1);
  };

  const handleSkip = async () => {
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
      posthog.captureException(error);
    }

    posthog.capture("organization_skipped", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      position_in_stack: currentIndex,
      total_causes: activeRecommendations.length,
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
      why_this_match: currentRecommendation.whyThisMatch,
      position_in_ranked_feed: currentIndex,
    });

    setCurrentIndex((index) => index + 1);
  };

  const handleOpenDetails = () => {
    if (!currentRecommendation) {
      return;
    }

    setSelectedRecommendation(currentRecommendation);
    setIsModalOpen(true);

    posthog.capture("organization_details_viewed", {
      organization_id: currentRecommendation.organization.slug,
      organization_name: currentRecommendation.organization.name,
      organization_ein: currentRecommendation.organization.ein,
      organization_city: currentRecommendation.organization.city,
      organization_state: currentRecommendation.organization.state,
      source: "discover",
      recommendation_version: RECOMMENDATION_VERSION,
      recommendation_score: currentRecommendation.score,
      matched_signals: currentRecommendation.matchedSignals,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecommendation(null);
  };

  const handleViewMyCauses = () => {
    router.push("/my-causes");
  };

  return (
    <>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {hasNoRecommendations ? (
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">
              No recommendations are available right now.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Try again shortly or revisit onboarding to refresh your
              preferences.
            </p>
            <Button size="lg" onClick={() => router.push("/onboarding")}>
              Update Preferences
            </Button>
          </div>
        ) : isFinished ? (
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">
              You&apos;ve seen all organizations for this session!
            </h2>
            <p className="mb-8 text-lg">You liked {likedCount} organizations.</p>
            <Button size="lg" onClick={handleViewMyCauses}>
              View My Causes
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-md flex-col items-center">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">Discover Organizations</h1>
              <p className="text-muted-foreground">
                Swipe right to like, left to skip
              </p>
            </div>

            <div className="relative mb-8 h-[560px] w-full">
              {activeRecommendations
                .slice(currentIndex, currentIndex + 2)
                .map((recommendation, stackIndex) => {
                  return (
                    <motion.div
                      key={recommendation.organization.ein}
                      className="absolute inset-0"
                      initial={{
                        scale: 1 - stackIndex * 0.02,
                        y: stackIndex * 4,
                        opacity: stackIndex === 0 ? 1 : 0,
                      }}
                      animate={{
                        scale: 1 - stackIndex * 0.02,
                        y: stackIndex * 4,
                        opacity: stackIndex === 0 ? 1 : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      style={{
                        zIndex: 3 - stackIndex,
                      }}
                    >
                      <SwipeableCard
                        organization={recommendation.organization}
                        onSwipeLeft={
                          stackIndex === 0 ? () => void handleSkip() : () => {}
                        }
                        onSwipeRight={stackIndex === 0 ? handleLike : () => {}}
                        onOpenDetails={
                          stackIndex === 0 ? handleOpenDetails : () => {}
                        }
                      />
                    </motion.div>
                  );
                })}
            </div>

            <div className="mb-8 flex gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14 rounded-full p-0"
                onClick={() => void handleSkip()}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Skip</span>
              </Button>

              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-pink-600 p-0 hover:bg-pink-700"
                onClick={() => void handleLike()}
              >
                <Heart className="h-6 w-6" />
                <span className="sr-only">Like</span>
              </Button>
            </div>

            <div className="flex h-10 items-center justify-center">
              {likedCount > 0 && (
                <Button variant="outline" onClick={handleViewMyCauses}>
                  View My Causes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedRecommendation && (
        <OrganizationModal
          organization={selectedRecommendation.organization}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
