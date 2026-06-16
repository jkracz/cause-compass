"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/my-causes", label: "My Causes" },
  { href: "/discover", label: "Discover" },
] as const;

export function TopNavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 sm:flex">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium whitespace-nowrap text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-deep)] hover:text-[var(--accent)] focus:bg-[var(--paper-deep)] focus:text-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none",
              isActive &&
                "bg-[var(--paper-deep)] font-semibold text-[var(--accent)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
