import { Skeleton } from "@/components/ui/skeleton";
import { GlassmorphicCard } from "@/components/glassmorphic-card";

export function DashboardSkeleton() {
  return (
    <>
      {/* Reflection and Journey Cards Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reflection Card Skeleton */}
        <GlassmorphicCard>
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            <Skeleton className="h-7 w-40 bg-white/10" />
          </div>
          <div className="mb-6 space-y-2">
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-5/6 bg-white/10" />
            <Skeleton className="h-4 w-4/6 bg-white/10" />
          </div>
          <div className="mb-6 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-md bg-white/10" />
              <Skeleton className="h-6 w-24 rounded-md bg-white/10" />
              <Skeleton className="h-6 w-16 rounded-md bg-white/10" />
            </div>
            <Skeleton className="h-1 w-full rounded-full bg-white/10" />
          </div>
          <Skeleton className="h-10 w-full bg-white/10" />
        </GlassmorphicCard>

        {/* Journey Card Skeleton */}
        <GlassmorphicCard>
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            <Skeleton className="h-7 w-36 bg-white/10" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 bg-white/10" />
                <Skeleton className="h-5 w-8 bg-white/10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-white/10" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-5 w-36 bg-white/10" />
                <Skeleton className="h-5 w-8 bg-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Liked Causes Skeleton */}
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Liked Causes</h2>
          <p className="mt-2 text-sm text-white/70">
            Your curated collection of organizations making a difference
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-full overflow-hidden rounded-xl border border-white/20 bg-white/10 p-0 shadow-lg backdrop-blur-md"
            >
              <Skeleton className="h-32 w-full bg-white/5" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
                <div className="mt-2 flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                  <Skeleton className="h-5 w-12 rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
