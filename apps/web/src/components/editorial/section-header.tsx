import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <header
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6",
        className,
      )}
    >
      <div className={cn("flex max-w-2xl flex-col gap-2.5", alignment)}>
        {kicker && (
          <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
            {kicker}
          </span>
        )}
        <h2 className="font-heading text-[clamp(1.75rem,2.5vw,2.5rem)] leading-[1.05] font-semibold text-[var(--ink)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[15px] leading-[1.55] text-[var(--ink-soft)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 self-start md:self-end">{action}</div>
      )}
    </header>
  );
}
