export function PortraitHeader({ sentence }: { sentence: string }) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-heading text-[clamp(2.4rem,5vw,3.5rem)] leading-[1] font-semibold text-[var(--ink)]">
        My Causes
      </h1>
      <p className="max-w-[640px] text-[17px] leading-[1.5] text-[var(--ink-soft)]">
        {sentence}
      </p>
    </header>
  );
}
