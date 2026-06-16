"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HOME_NAVIGATION_EVENT } from "@/lib/home-navigation";

export function HomeNavLink() {
  const pathname = usePathname();

  const handleClick = () => {
    if (pathname === "/") {
      window.dispatchEvent(new Event(HOME_NAVIGATION_EVENT));
    }
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="Cause Compass home"
      className="flex items-center gap-2 text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
    >
      <div className="flex h-8 w-8 items-center justify-center">
        <Image
          src="/logo.png"
          alt=""
          width={28}
          height={28}
          priority
          aria-hidden
        />
      </div>
      <span className="font-heading hidden text-xl font-bold tracking-tight text-[var(--ink)] sm:inline">
        Cause Compass
      </span>
    </Link>
  );
}
