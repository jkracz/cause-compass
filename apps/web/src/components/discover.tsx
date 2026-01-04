"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import { motion } from "motion/react";
import posthog from "posthog-js";

import { SwipeableCard } from "@/components/swipeable-card";
import { Button } from "@/components/ui/button";
import { Cause } from "@cause/types";
import { addLikedOrganization } from "@/lib/actions";

export default function Discover({ causes }: { causes: Cause[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCauses, setLikedCauses] = useState<Cause[]>([]);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);
  console.log("causes", causes);

  const handleLike = async () => {
    if (currentIndex < causes.length) {
      const org = causes[currentIndex];
      if (!org) {
        return;
      }
      await addLikedOrganization(org.dbId);
      const updatedLikedCauses = [...likedCauses, org];
      setLikedCauses(updatedLikedCauses);

      // Track organization liked (key engagement event)
      posthog.capture("organization_liked", {
        organization_id: org.dbId,
        organization_name: org.name,
        organization_ein: org.ein,
        organization_city: org.city,
        organization_state: org.state,
        position_in_stack: currentIndex,
        total_causes: causes.length,
        total_liked_so_far: updatedLikedCauses.length,
      });

      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < causes.length) {
      const org = causes[currentIndex];

      // Track organization skipped
      posthog.capture("organization_skipped", {
        organization_id: org?.dbId,
        organization_name: org?.name,
        organization_ein: org?.ein,
        position_in_stack: currentIndex,
        total_causes: causes.length,
      });

      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleViewMyCauses = () => {
    router.push("/my-causes");
  };

  const isFinished = currentIndex >= causes.length;

  // Track discovery session completed when user finishes all cards
  if (isFinished && !hasTrackedCompletion) {
    setHasTrackedCompletion(true);
    posthog.capture("discovery_session_completed", {
      total_causes_shown: causes.length,
      total_liked: likedCauses.length,
      total_skipped: causes.length - likedCauses.length,
      like_rate: causes.length > 0 ? likedCauses.length / causes.length : 0,
    });
  }

  return (
    <>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {isFinished ? (
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">
              You&apos;ve seen all organizations for this session!
            </h2>
            <p className="mb-8 text-lg">
              You liked {likedCauses.length} organizations.
            </p>
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

            <div className="relative mb-8 h-[500px] w-full">
              {causes
                .slice(currentIndex, currentIndex + 2)
                .map((cause, stackIndex) => {
                  return (
                    <motion.div
                      key={cause.ein}
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
                        organization={cause}
                        onSwipeLeft={stackIndex === 0 ? handleSkip : () => {}}
                        onSwipeRight={stackIndex === 0 ? handleLike : () => {}}
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
                onClick={handleSkip}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Skip</span>
              </Button>

              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-pink-600 p-0 hover:bg-pink-700"
                onClick={handleLike}
              >
                <Heart className="h-6 w-6" />
                <span className="sr-only">Like</span>
              </Button>
            </div>

            {/* Reserved space for the "View My Organizations" button to prevent layout shift */}
            <div className="flex h-10 items-center justify-center">
              {likedCauses.length > 0 && (
                <Button variant="outline" onClick={handleViewMyCauses}>
                  View My Causes
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
