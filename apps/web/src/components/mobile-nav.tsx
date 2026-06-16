"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/my-causes", label: "My Causes" },
  { href: "/discover", label: "Discover" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rule)] bg-white/80 text-[var(--ink-soft)] transition hover:bg-white hover:text-[var(--accent)] sm:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border-[var(--rule)] bg-white text-[var(--ink-soft)]"
      >
        {LINKS.map((link) => {
          const isActive = pathname === link.href;

          return (
            <DropdownMenuItem key={link.href} asChild>
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "cursor-pointer text-sm font-medium focus:bg-[var(--paper-deep)] focus:text-[var(--accent)]",
                  isActive && "font-semibold text-[var(--accent)]",
                )}
              >
                {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
