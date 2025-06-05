"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { MirrorQuestion } from "@/components/mirror-question";
import { MosaicPiece } from "@/components/mosaic-piece";
import { generateQuestions } from "@/lib/questions";
import type { Question } from "@/lib/questions";

export default function OnboardingPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completedPieces, setCompletedPieces] = useState<number[]>([]);
  const [locationPermission, setLocationPermission] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // Generate questions for this session
    const sessionQuestions = generateQuestions();
    setQuestions(sessionQuestions);
  }, []);

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

  const handleNext = () => {
    if (isLastQuestion) {
      // Save answers to localStorage
      localStorage.setItem("userPreferences", JSON.stringify(answers));
      // Set cookie to indicate user has visited
      document.cookie = "hasVisited=true; path=/; max-age=31536000"; // 1 year
      // Navigate to discover page
      router.push("/discover");
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Don't render until questions are loaded
  if (questions.length === 0) {
    return (
      <main className="relative min-h-screen w-full">
        <div className="relative z-10 container flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
          </div>
        </div>
      </main>
    );
  }

  const isAnswered =
    currentQuestion?.type === "location"
      ? locationPermission !== null
      : !!answers[currentQuestion?.id];

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container flex min-h-screen flex-col items-center justify-center px-4 py-12">
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
                      No worries! We&apos;ll still show you amazing
                      organizations.
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
                  onAnswer={(answer) =>
                    handleAnswer(currentQuestion.id, answer)
                  }
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
      </div>
    </main>
  );
}
