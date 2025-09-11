"use client";

import type React from "react";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Cause } from "@/lib/schemas";

interface OrganizationCardProps {
  organization: Cause;
  onClick: () => void;
}

export function OrganizationCard({
  organization,
  onClick,
}: OrganizationCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Card clicked for:", organization.name); // Debug log
    onClick();
  };

  return (
    <div
      className="group h-full cursor-pointer overflow-hidden rounded-xl border border-white/20 bg-white/10 p-0 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-white/10"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateX = (mouseY / rect.height) * -10;
        const rotateY = (mouseX / rect.width) * 10;

        e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
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
      <div className="relative h-32 w-full bg-gray-100">
        {organization.logoUrl ? (
          <Image
            src={organization.logoUrl}
            alt={organization.name}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          // Fallback visual with organization initials
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl">
            <span className="text-3xl font-bold">
              {organization.name
                .split(" ")
                .map((word: string) => word[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold">{organization.name}</h3>
        <p className="text-muted-foreground line-clamp-1 text-xs">
          {organization.city}, {organization.state}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {organization.keywords &&
            organization.keywords.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          {organization.keywords && organization.keywords.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{organization.keywords.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
