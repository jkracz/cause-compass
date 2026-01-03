import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassmorphicCard } from "@/components/glassmorphic-card";

export function DiscoverSkeleton() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Discover Organizations</h1>
          <p className="text-muted-foreground">
            Swipe right to like, left to skip
          </p>
        </div>

        <div className="relative mb-8 h-[500px] w-full">
          <GlassmorphicCard
            variant="swipe"
            className="flex h-full flex-col justify-center overflow-hidden p-8"
          >
            {/* Floating Logo Skeleton */}
            <div className="absolute top-8 left-1/2 z-10 -translate-x-1/2 transform">
              <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4 pt-32 text-center">
              <div>
                <Skeleton className="mx-auto mb-2 h-9 w-3/4 bg-white/10" />
                <Skeleton className="mx-auto h-7 w-1/2 bg-white/10" />
              </div>

              <div className="px-4">
                <Skeleton className="mx-auto h-4 w-full bg-white/10" />
                <Skeleton className="mx-auto mt-2 h-4 w-5/6 bg-white/10" />
                <Skeleton className="mx-auto mt-2 h-4 w-4/6 bg-white/10" />
              </div>
            </div>
          </GlassmorphicCard>
        </div>

        <div className="mb-8 flex gap-4">
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full p-0"
            disabled
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Skip</span>
          </Button>

          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-pink-600 p-0 hover:bg-pink-700"
            disabled
          >
            <Heart className="h-6 w-6" />
            <span className="sr-only">Like</span>
          </Button>
        </div>

        {/* Reserved space for the "View My Organizations" button to prevent layout shift */}
        <div className="flex h-10 items-center justify-center" />
      </div>
    </div>
  );
}
