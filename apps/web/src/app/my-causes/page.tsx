import type { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "My Causes",
  description:
    "Review the nonprofit organizations and causes you have saved on Cause Compass.",
  alternates: {
    canonical: "/my-causes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyOrgsPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <DashboardContent />
      </div>
    </main>
  );
}
