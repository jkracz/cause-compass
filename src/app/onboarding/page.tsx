import { generateQuestions } from "@/lib/questions";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  // Generate questions on the server
  const questions = generateQuestions();

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <OnboardingFlow questions={questions} />
      </div>
    </main>
  );
}
