import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TopNavAccount } from "@/components/top-nav-account";
import { TopNavLinks } from "@/components/top-nav-links";

export function TopNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-[var(--rule)] bg-[color:rgba(240,230,245,0.85)] backdrop-blur-md",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
          >
            <div className="flex h-8 w-8 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Cause Compass Logo"
                width={28}
                height={28}
                priority
              />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-[var(--ink)]">
              Cause Compass
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <TopNavLinks />
            <TopNavAccount />
          </div>
        </div>
      </div>
    </nav>
  );
}
