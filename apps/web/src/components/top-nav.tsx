import { cn } from "@/lib/utils";
import { TopNavAccount } from "@/components/top-nav-account";
import { HomeNavLink } from "@/components/home-nav-link";
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
          <HomeNavLink />

          <div className="flex items-center gap-3">
            <TopNavLinks />
            <TopNavAccount />
          </div>
        </div>
      </div>
    </nav>
  );
}
