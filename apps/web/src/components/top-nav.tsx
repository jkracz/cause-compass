"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, RotateCcw } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/components/app-session-provider";
import { useResetPreferences } from "@/hooks/use-reset-preferences";

export function TopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const session = useAppSession();
  const { isAuthenticated, isPending, resetPreferences } = useResetPreferences();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "border-border/50 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md",
          className,
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="text-foreground hover:text-foreground/80 flex items-center gap-2 transition-colors"
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
              <span
                className="font-heading text-xl font-bold tracking-tight text-white"
                style={{
                  textShadow:
                    "0 0 20px rgba(168, 85, 247, 0.4), 0 0 10px rgba(236, 72, 153, 0.3)",
                }}
              >
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
                        "bg-transparent text-white/70 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white",
                        pathname === "/my-causes" &&
                          "bg-white/10 font-semibold text-white shadow-sm backdrop-blur-sm",
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
                        "bg-transparent text-white/70 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white",
                        pathname === "/discover" &&
                          "bg-white/10 font-semibold text-white shadow-sm backdrop-blur-sm",
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
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                      aria-label="Open account menu"
                    >
                      {session.picture ? (
                        <Image
                          src={session.picture}
                          alt={session.name || "Profile"}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {(session.name || session.email || "U")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 border-white/10 bg-black/85 text-white backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                          {session.picture ? (
                            <Image
                              src={session.picture}
                              alt={session.name || "Profile"}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-base font-semibold text-white">
                              {(session.name || session.email || "U")
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {session.name || "Signed in"}
                          </p>
                          <p className="truncate text-xs text-white/60">
                            {session.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setIsResetDialogOpen(true)}
                      className="text-white/80 focus:bg-white/10 focus:text-white"
                    >
                      <RotateCcw className="size-4" />
                      Start over
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void session.signOut()}
                      className="text-white/80 focus:bg-white/10 focus:text-white"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => void session.signIn()}
                  className="inline-flex h-9 cursor-pointer items-center gap-2.5 rounded-full border-none bg-white px-4 shadow-sm transition-shadow hover:shadow-md active:shadow-none"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-medium text-neutral-700">
                    Sign in
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Your Journey?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAuthenticated
                ? "This will clear your saved reflection and preferences from your account. Your liked organizations will stay."
                : "This will clear your saved reflection and preferences in this browser. Your liked organizations will stay."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                void resetPreferences().then(() => setIsResetDialogOpen(false))
              }
              variant="destructive"
            >
              {isPending ? "Clearing..." : "Clear Preferences"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
