"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OrgMarkProps {
  name: string;
  logoUrl?: string;
  slug?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<OrgMarkProps["size"]>, string> = {
  sm: "h-12 w-12 rounded-xl text-base",
  md: "h-16 w-16 rounded-xl text-lg",
  lg: "h-24 w-24 rounded-2xl text-2xl",
  xl: "h-40 w-40 rounded-[1.75rem] text-4xl sm:h-48 sm:w-48",
};

const IMAGE_PADDING_CLASS: Record<NonNullable<OrgMarkProps["size"]>, string> = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-2.5",
};

const PALETTE = [
  ["#C8266E", "#5B4B9E"],
  ["#5B4B9E", "#1A0F2C"],
  ["#C58F5A", "#8E5C4A"],
  ["#5C7A5E", "#2F4A35"],
  ["#5A7A8E", "#1F3A4D"],
  ["#8E6F4F", "#4A3624"],
];

const FAILED_LOGO_URLS = new Set<string>();

function hashSlug(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function OrgMark({
  name,
  logoUrl,
  slug,
  size = "md",
  className,
}: OrgMarkProps) {
  const sizeClass = SIZE_CLASS[size];
  const imagePaddingClass = IMAGE_PADDING_CLASS[size];
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(() => {
    if (!logoUrl) return null;
    return FAILED_LOGO_URLS.has(logoUrl) ? logoUrl : null;
  });

  if (logoUrl && failedLogoUrl !== logoUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-[var(--rule)] bg-[var(--paper)]",
          sizeClass,
          className,
        )}
      >
        <Image
          src={logoUrl}
          alt={name}
          fill
          className={cn(
            "object-contain drop-shadow-[0_1px_1px_rgba(26,15,44,0.45)]",
            imagePaddingClass,
          )}
          unoptimized
          loading="eager"
          onError={() => {
            FAILED_LOGO_URLS.add(logoUrl);
            setFailedLogoUrl(logoUrl);
          }}
        />
      </div>
    );
  }

  const seed = hashSlug(slug ?? name);
  const palette = PALETTE[seed % PALETTE.length] ?? PALETTE[0]!;
  const [from, to] = palette;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/30 text-white shadow-[0_8px_24px_-14px_rgba(91,75,158,0.45)]",
        sizeClass,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      <span className="font-heading font-semibold tracking-tight drop-shadow-sm">
        {getInitials(name)}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/2 -right-1/3 h-[160%] w-[160%] rounded-full opacity-40 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
