export function DiscoverSkeleton() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh]"
      >
        <div className="absolute -top-40 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-6 pb-10 sm:px-8 sm:pt-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="h-7 w-72 rounded bg-[var(--paper-deep)]" />
          <div className="flex w-full max-w-[280px] items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className="h-[3px] flex-1 rounded-full bg-[var(--rule)]"
              />
            ))}
          </div>
          <span className="h-3 w-64 rounded bg-[var(--paper-deep)]" />
        </header>

        <div className="relative mx-auto mt-5 mb-6 h-[520px] w-full max-w-md sm:h-[560px]">
          <div
            aria-hidden
            className="absolute inset-x-3 top-3 bottom-[-6px] rounded-[1.25rem] border border-[var(--rule)] bg-white/55"
          />
          <div className="glass-card absolute inset-0 flex flex-col gap-6 overflow-hidden p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="h-3 w-20 rounded-full bg-[var(--paper-deep)]" />
              <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-5">
              <span className="h-40 w-40 rounded-[1.75rem] bg-[var(--paper-deep)] sm:h-48 sm:w-48" />
              <div className="flex w-full flex-col items-center gap-2">
                <span className="h-5 w-3/4 rounded bg-[var(--paper-deep)]" />
                <span className="h-3 w-1/3 rounded bg-[var(--paper-deep)]" />
              </div>
              <div className="flex w-full max-w-[44ch] flex-col gap-1.5 pl-4">
                <span className="h-3 w-full rounded bg-[var(--paper-deep)]" />
                <span className="h-3 w-5/6 rounded bg-[var(--paper-deep)]" />
                <span className="h-3 w-3/4 rounded bg-[var(--paper-deep)]" />
              </div>
            </div>
            <div className="mt-auto flex items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
              <span className="h-3 w-32 rounded bg-[var(--paper-deep)]" />
              <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <span className="h-[46px] flex-1 rounded-full border border-[var(--rule-strong)] bg-white/40 sm:max-w-[200px]" />
            <span className="h-[46px] flex-1 rounded-full bg-[var(--ink)]/85 sm:max-w-[200px]" />
          </div>
          <div className="h-6" />
        </div>
      </main>
    </div>
  );
}
