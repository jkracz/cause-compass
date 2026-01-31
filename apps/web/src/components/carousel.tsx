"use client";

import { OrganizationCard } from "@/components/organization-card";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Organization = Doc<"organizations">;

interface CarouselProps {
  organizations: Organization[];
  direction: "left" | "right";
  onCardClick: (org: Organization) => void;
  className?: string;
}

export function Carousel({
  organizations,
  direction,
  onCardClick,
  className,
}: CarouselProps) {
  // Don't render if no organizations
  if (organizations.length === 0) {
    return null;
  }

  // Duplicate cards for seamless infinite loop
  const duplicatedOrgs = [...organizations, ...organizations];

  return (
    <div className={cn("group w-full overflow-hidden py-2", className)}>
      <div
        className={cn(
          "flex gap-4",
          direction === "left" ? "animate-scroll-left" : "animate-scroll-right",
          // Pause animation on hover or when any card has focus (keyboard accessibility)
          "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
        )}
        style={{
          width: `calc(${organizations.length} * (280px + 1rem) * 2)`,
        }}
      >
        {duplicatedOrgs.map((org, index) => (
          <div
            key={`${org._id}-${index}`}
            className="w-[280px] flex-shrink-0"
          >
            <OrganizationCard
              organization={org}
              onClick={() => onCardClick(org)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
