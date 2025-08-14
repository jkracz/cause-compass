"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function TopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "border-border/50 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-foreground hover:text-foreground/80 flex items-center gap-2 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
              <Image
                src="/logo.png"
                alt="Cause Compass Logo"
                width={28}
                height={28}
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Cause Compass
            </span>
          </Link>

          {/* Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground bg-transparent",
                    pathname === "/my-orgs" &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <Link href="/my-orgs">My Causes</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground bg-transparent",
                    pathname === "/discover" &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <Link href="/discover">Discover</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  );
}
