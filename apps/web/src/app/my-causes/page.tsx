import { StartOverButton } from "@/components/start-over-button";
import { DashboardContent } from "./dashboard-content";

export default function MyOrgsPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Navigator</h1>
          <StartOverButton />
        </div>

        <DashboardContent />
      </div>
    </main>
  );
}
