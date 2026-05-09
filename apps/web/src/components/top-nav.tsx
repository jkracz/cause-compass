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
import { AccountAvatar } from "@/components/account-avatar";
import { AccountAuthDialog } from "@/components/account-auth-dialog";
import { useAppSession } from "@/components/app-session-provider";
import { useResetPreferences } from "@/hooks/use-reset-preferences";

export function TopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const session = useAppSession();
  const { isAuthenticated, isPending, resetPreferences } = useResetPreferences();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isAccountAuthOpen, setIsAccountAuthOpen] = useState(false);

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
                      <AccountAvatar
                        picture={session.picture}
                        name={session.name}
                        email={session.email}
                        size={40}
                        textClassName="text-sm font-semibold text-white"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 border-white/10 bg-black/85 text-white backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                          <AccountAvatar
                            picture={session.picture}
                            name={session.name}
                            email={session.email}
                            size={48}
                            textClassName="text-base font-semibold text-white"
                          />
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
      <AccountAuthDialog
        open={isAccountAuthOpen}
        onOpenChange={setIsAccountAuthOpen}
      />
    </>
  );
}
