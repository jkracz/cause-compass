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
            <div className="flex h-8 w-8 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Cause Compass Logo"
                width={28}
                height={28}
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
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
                    "bg-transparent text-white/70 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white",
                    pathname === "/my-causes" &&
                      "bg-white/10 text-white font-semibold shadow-sm backdrop-blur-sm",
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
                      "bg-white/10 text-white font-semibold shadow-sm backdrop-blur-sm",
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
