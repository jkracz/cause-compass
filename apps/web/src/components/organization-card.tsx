"use client";

import type React from "react";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { api } from "@cause/backend/convex/_generated/api";
import { sanitizeTagline } from "@cause/types";
import { useAppSession } from "@/components/app-session-provider";

type Organization = Doc<"organizations">;

interface OrganizationCardProps {
  organization: Organization;
  onClick: () => void;
}

const GEO_GLYPH: Record<string, string> = {
  Global: "◐",
  National: "◈",
  Regional: "◇",
  Local: "◉",
};

export function OrganizationCard({
  organization,
  onClick,
}: OrganizationCardProps) {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const likeOrganization = useMutation(api.users.likeOrganization);
  const unlikeOrganization = useMutation(api.users.unlikeOrganization);

  const isLiked =
    viewer?.likedOrganizations?.includes(organization.slug) ?? false;

  const previewText =
    sanitizeTagline(organization.tagline) ||
    organization.oneSentenceSummary ||
    organization.mission ||
    organization.whySupport;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      await unlikeOrganization({ guestId, organizationId: organization.slug });
    } else {
      await likeOrganization({ guestId, organizationId: organization.slug });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <article
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.10] to-white/[0.03] shadow-[0_8px_28px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 ease-out will-change-transform hover:border-white/25 hover:shadow-[0_28px_50px_-14px_rgba(236,72,153,0.3)]"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - y) * 7;
        const rotateY = (x - 0.5) * 7;
        e.currentTarget.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-20 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[110%]" />

      <div className="relative h-28 w-full shrink-0 overflow-hidden bg-gray-100">
        {organization.logoUrl ? (
          <Image
            src={organization.logoUrl}
            alt={organization.name}
            fill
            className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            unoptimized
            loading="eager"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700">
            <span className="font-heading text-4xl font-bold text-white drop-shadow-sm">
              {organization.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 3)
                .toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

        {organization.geographicFocus && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.14em] text-white/90 uppercase backdrop-blur-md">
            <span className="text-amber-300">
              {GEO_GLYPH[organization.geographicFocus]}
            </span>
            {organization.geographicFocus}
          </div>
        )}

        <button
          type="button"
          aria-label={isLiked ? "Remove from My Causes" : "Add to My Causes"}
          onClick={(e) => void handleLikeToggle(e)}
          className={`absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-pink-400/40 hover:bg-black/70 focus-visible:opacity-100 ${
            isLiked
              ? "opacity-100"
              : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          }`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-300 ${
              isLiked
                ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.55)]"
                : "text-white"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3 pb-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/50 uppercase">
          <span className="h-px w-3 shrink-0 bg-white/35" />
          <span className="truncate">{organization.city}</span>
          <span className="text-white/30">·</span>
          <span className="shrink-0">{organization.state}</span>
        </div>

        <h3 className="font-heading line-clamp-2 text-[17px] leading-[1.18] font-semibold text-white">
          {organization.name}
        </h3>

        {previewText && (
          <p className="line-clamp-2 text-[12.5px] leading-[1.5] text-white/65">
            {previewText}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {organization.keywords?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/70"
            >
              {tag}
            </span>
          ))}
          {organization.keywords && organization.keywords.length > 2 && (
            <span className="text-[10px] font-medium tracking-wide text-white/45">
              +{organization.keywords.length - 2} more
            </span>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-400/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </article>
  );
}
