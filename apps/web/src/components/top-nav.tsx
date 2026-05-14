"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountAvatar } from "@/components/account-avatar";
import { AccountAuthDialog } from "@/components/account-auth-dialog";
import { useAppSession } from "@/components/app-session-provider";

export function TopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const session = useAppSession();
  const [isAccountAuthOpen, setIsAccountAuthOpen] = useState(false);

  return (
    <>
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
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent text-[var(--ink-soft)] hover:bg-[var(--paper-deep)] hover:text-[var(--accent)] focus:bg-[var(--paper-deep)] focus:text-[var(--accent)]",
                        pathname === "/my-causes" &&
                          "bg-[var(--paper-deep)] font-semibold text-[var(--accent)]",
                      )}
                    >
                      <Link href="/my-causes">My Causes</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent text-[var(--ink-soft)] hover:bg-[var(--paper-deep)] hover:text-[var(--accent)] focus:bg-[var(--paper-deep)] focus:text-[var(--accent)]",
                        pathname === "/discover" &&
                          "bg-[var(--paper-deep)] font-semibold text-[var(--accent)]",
                      )}
                    >
                      <Link href="/discover">Discover</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              {session.isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--rule)] bg-white/80 transition hover:bg-white"
                      aria-label="Open account menu"
                    >
                      <AccountAvatar
                        picture={session.picture}
                        name={session.name}
                        email={session.email}
                        size={40}
                        textClassName="text-sm font-semibold text-[var(--ink)]"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 border-[var(--rule)] bg-white text-[var(--ink)] backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--rule)] bg-[var(--paper-deep)]">
                          <AccountAvatar
                            picture={session.picture}
                            name={session.name}
                            email={session.email}
                            size={48}
                            textClassName="text-base font-semibold text-[var(--ink)]"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--ink)]">
                            {session.name || "Signed in"}
                          </p>
                          <p className="truncate text-xs text-[var(--ink-mute)]">
                            {session.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => void session.signOut()}
                      className="text-[var(--ink-soft)] focus:bg-[var(--paper-deep)] focus:text-[var(--accent)]"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => setIsAccountAuthOpen(true)}
                  className="inline-flex h-9 cursor-pointer items-center gap-2.5 rounded-full border-none bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition-shadow hover:shadow-md active:shadow-none"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AccountAuthDialog
        open={isAccountAuthOpen}
        onOpenChange={setIsAccountAuthOpen}
      />
    </>
  );
}
