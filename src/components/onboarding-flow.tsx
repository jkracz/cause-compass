"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { MirrorQuestion } from "@/components/mirror-question";
import { MosaicPiece } from "@/components/mosaic-piece";
import type { Question } from "@/lib/questions";

interface OnboardingFlowProps {
  questions: Question[];
}

export function OnboardingFlow({ questions }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completedPieces, setCompletedPieces] = useState<number[]>([]);
  const [locationPermission, setLocationPermission] = useState<string | null>(
    null,
  );

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // Add this question index to completed pieces
    if (!completedPieces.includes(currentQuestionIndex)) {
      setCompletedPieces((prev) => [...prev, currentQuestionIndex]);
    }
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

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocationPermission("granted");
        handleAnswer("location", JSON.stringify(location));
      } catch (error) {
        setLocationPermission("denied");
        handleAnswer("location", "denied");
      }
    } else {
      setLocationPermission("unavailable");
      handleAnswer("location", "unavailable");
    }
  };

  const handleLocationSkip = () => {
    setLocationPermission("skipped");
    handleAnswer("location", "skipped");
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      const formData = new FormData();

      // Add each answer to the form data
      Object.entries(answers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, value as string);
        }
      });

      try {
        // Import and call the server action
        const { saveUserPreferences } = await import("@/lib/actions/user");
        await saveUserPreferences(formData);
        // Navigation will be handled by the server action
      } catch (error) {
        console.error("Error saving preferences:", error);
        // Fallback navigation in case of error
        router.push("/discover");
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
      : !!answers[currentQuestion?.id];

  return (
    <>
      <div className="mb-8 flex justify-center">
        <div className="relative h-40 w-40">
          {questions.map((_, index) => (
            <MosaicPiece
              key={index}
              index={index}
              total={questions.length}
              isCompleted={completedPieces.includes(index)}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <GlassmorphicCard>
          {currentQuestion?.type === "location" ? (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold">
                {currentQuestion.question}
              </h2>
              <p className="text-muted-foreground text-center">
                {currentQuestion.description}
              </p>

              {locationPermission === null && (
                <div className="space-y-3">
                  <Button onClick={handleLocationRequest} className="w-full">
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
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.description && (
                  <p className="text-muted-foreground">
                    {currentQuestion.description}
                  </p>
                )}
              </div>
              <MirrorQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
                value={answers[currentQuestion?.id]}
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

            <Button onClick={handleNext} disabled={!isAnswered}>
              {isLastQuestion ? "Discover Nonprofits" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </GlassmorphicCard>
      </div>
    </>
  );
}
