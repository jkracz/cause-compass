"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { MirrorQuestion } from "@/components/mirror-question";
import { MosaicPiece } from "@/components/mosaic-piece";
import type { Question } from "@/lib/questions";
import { api } from "@cause/backend/convex/_generated/api";
import { useAppSession } from "@/components/app-session-provider";
import type { UserPreferences } from "@cause/lib";

interface OnboardingFlowProps {
  questions: Question[];
}

type StoredCoordinates = {
  latitude: number;
  longitude: number;
};

export function OnboardingFlow({ questions }: OnboardingFlowProps) {
  const router = useRouter();
  const { guestId } = useAppSession();
  const saveViewerPreferences = useMutation(api.users.saveViewerPreferences);
  const hasTrackedOnboardingStartRef = useRef(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [locationPermission, setLocationPermission] = useState<string | null>(
    null,
  );

  // Track onboarding started on initial mount
  useEffect(() => {
    if (!hasTrackedOnboardingStartRef.current) {
      hasTrackedOnboardingStartRef.current = true;
      posthog.capture("onboarding_started", {
        total_questions: questions.length,
      });
    }
  }, [questions.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // Track question answered
    posthog.capture("onboarding_question_answered", {
      question_id: questionId,
      question_type: currentQuestion?.type,
      question_index: currentQuestionIndex,
      total_questions: questions.length,
    });
  };

  const handleLocationRequest = async () => {
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
            });
          },
        );

        const location: StoredCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocationPermission("granted");
        handleAnswer("location", JSON.stringify(location));

        // Track location permission granted
        posthog.capture("location_permission_granted", {
          has_coordinates: true,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationPermission("denied");
        handleAnswer("location", "denied");

        // Track location permission denied
        posthog.capture("location_permission_denied", {
          reason: "user_denied",
        });

        // Only capture unexpected errors, not user denials
        const isUserDenial =
          (error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code: number }).code === 1) ||
          (error instanceof Error &&
            (error.name === "NotAllowedError" ||
              error.message.toLowerCase().includes("denied") ||
              error.message.toLowerCase().includes("permission")));

        if (!isUserDenial) {
          posthog.captureException(error);
        }
      }
    } else {
      setLocationPermission("unavailable");
      handleAnswer("location", "unavailable");

      // Track location unavailable
      posthog.capture("location_permission_denied", {
        reason: "unavailable",
      });
    }
  };

  const handleLocationSkip = () => {
    setLocationPermission("skipped");
    handleAnswer("location", "skipped");

    // Track location skipped
    posthog.capture("location_permission_denied", {
      reason: "skipped",
    });
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      const openEndedQuestion = questions.find((q) => q.id === "openEnded");
      const preferences: UserPreferences = {
        causes: Array.isArray(answers.causes) ? answers.causes : undefined,
        location:
          typeof answers.location === "string" ? answers.location : undefined,
        helpMethod: Array.isArray(answers.helpMethod)
          ? answers.helpMethod
          : undefined,
        changeScope:
          typeof answers.changeScope === "string"
            ? answers.changeScope
            : undefined,
        openEnded:
          typeof answers.openEnded === "string" && openEndedQuestion
            ? {
                question: openEndedQuestion.question,
                answer: answers.openEnded,
              }
            : undefined,
      };

      posthog.capture("onboarding_completed", {
        total_questions: questions.length,
        questions_answered: Object.keys(answers).length,
        has_location: locationPermission === "granted",
      });

      try {
        await saveViewerPreferences({
          guestId,
          preferences,
        });
        router.push("/discover");
      } catch (error) {
        console.error("Error saving preferences:", error);
        posthog.captureException(error);
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const isAnswered =
    currentQuestion?.type === "location"
      ? locationPermission !== null
      : !!answers[currentQuestion?.id ?? ""];

  return (
    <>
      <div className="mb-8 flex justify-center">
        <div className="relative h-40 w-40">
          {questions.map((_, index) => (
            <MosaicPiece
              key={index}
              index={index}
              total={questions.length}
              isActive={index <= currentQuestionIndex}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <GlassmorphicCard>
          {currentQuestion?.type === "location" ? (
            <div className="min-h-[200px] space-y-4">
              <h2 className="text-center text-xl font-semibold">
                {currentQuestion.question}
              </h2>
              <p className="text-muted-foreground text-center">
                {currentQuestion.description}
              </p>

              {locationPermission === null && (
                <div className="space-y-3">
                  <Button
                    onClick={() => void handleLocationRequest()}
                    className="w-full"
                  >
                    Share My Location
                  </Button>
                  <Button
                    onClick={handleLocationSkip}
                    variant="outline"
                    className="w-full"
                  >
                    Skip for Now
                  </Button>
                </div>
              )}

              {locationPermission === "granted" && (
                <div className="rounded-lg bg-green-500/20 p-3 text-center">
                  <p className="text-green-300">
                    ✓ Location shared! We&apos;ll find great local causes for
                    you.
                  </p>
                </div>
              )}

              {locationPermission === "denied" && (
                <div className="rounded-lg bg-yellow-500/20 p-3 text-center">
                  <p className="text-yellow-300">
                    No worries! We&apos;ll still show you amazing organizations.
                  </p>
                </div>
              )}

              {locationPermission === "skipped" && (
                <div className="rounded-lg bg-blue-500/20 p-3 text-center">
                  <p className="text-blue-300">
                    Skipped location. You can always enable it later!
                  </p>
                </div>
              )}

              {locationPermission === "unavailable" && (
                <div className="rounded-lg bg-gray-500/20 p-3 text-center">
                  <p className="text-gray-300">
                    Location not available on this device.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[200px] space-y-4">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  {currentQuestion?.question}
                </h2>
                {currentQuestion?.description && (
                  <p className="text-muted-foreground">
                    {currentQuestion?.description}
                  </p>
                )}
              </div>
              <MirrorQuestion
                question={
                  currentQuestion ?? { id: "", question: "", type: "text" }
                }
                onAnswer={(answer) =>
                  handleAnswer(currentQuestion?.id ?? "", answer)
                }
                value={answers[currentQuestion?.id ?? ""]}
                isFirstQuestion={isFirstQuestion}
              />
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button onClick={() => void handleNext()} disabled={!isAnswered}>
              {isLastQuestion ? "Discover Nonprofits" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </GlassmorphicCard>
      </div>
    </>
  );
}
