import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-12 md:space-y-16">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32 bg-[var(--paper-deep)]" />
        <Skeleton className="h-12 w-64 bg-[var(--paper-deep)]" />
        <Skeleton className="h-4 w-full max-w-[640px] bg-[var(--paper-deep)]" />
        <Skeleton className="h-4 w-3/4 max-w-[480px] bg-[var(--paper-deep)]" />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-[20px] border border-[var(--rule)] bg-[var(--card)] p-5 md:p-6">
            <Skeleton className="mb-2 h-3 w-32 bg-[var(--paper-deep)]" />
            <Skeleton className="mb-4 h-6 w-56 bg-[var(--paper-deep)]" />
            <Skeleton className="mx-auto aspect-square w-full max-w-[460px] rounded-full bg-[var(--paper-deep)]" />
          </div>
        </div>
        <div className="col-span-12 space-y-4 lg:col-span-5">
          <Skeleton className="h-20 rounded-[20px] bg-[var(--card)]" />
          <Skeleton className="h-60 rounded-[20px] bg-[var(--card)]" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-[20px] bg-[var(--card)]" />
            <Skeleton className="h-32 rounded-[20px] bg-[var(--card)]" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mb-8 flex flex-col gap-2.5">
          <Skeleton className="h-3 w-32 bg-[var(--paper-deep)]" />
          <Skeleton className="h-8 w-48 bg-[var(--paper-deep)]" />
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-[260px] rounded-2xl border border-[var(--rule)] bg-[var(--card)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
