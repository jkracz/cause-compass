import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <>
      {/* Hero Section */}
      <section className="px-4 pt-8 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Skeleton className="mb-4 h-20 w-20 rounded-2xl bg-white/10" />
          <Skeleton className="mb-2 h-12 w-64 bg-white/10" />
          <Skeleton className="mb-6 h-6 w-80 bg-white/10" />
          <Skeleton className="h-14 w-full max-w-xl rounded-full bg-white/10" />
        </div>
      </section>

      {/* Category rows skeleton */}
      <main className="pb-16">
        <div className="space-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="px-4 md:px-14">
                <Skeleton className="h-7 w-48 bg-white/10" />
              </div>
              <div className="scrollbar-hide flex gap-4 overflow-hidden pl-4 md:pl-14">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-[220px] w-[260px] flex-shrink-0 rounded-xl bg-white/10 sm:w-[280px]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
