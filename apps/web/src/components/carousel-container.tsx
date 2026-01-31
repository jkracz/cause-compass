"use client";

import { motion } from "motion/react";
import { Carousel } from "@/components/carousel";
import { Doc } from "@cause/backend/convex/_generated/dataModel";

type Organization = Doc<"organizations">;

interface CarouselContainerProps {
  organizations: Organization[];
  onCardClick: (org: Organization) => void;
  isSearching: boolean;
}

export function CarouselContainer({
  organizations,
  onCardClick,
  isSearching,
}: CarouselContainerProps) {
  // Split organizations into 3 groups for 3 carousels
  const groupSize = Math.ceil(organizations.length / 3);
  const carousel1Orgs = organizations.slice(0, groupSize);
  const carousel2Orgs = organizations.slice(groupSize, groupSize * 2);
  const carousel3Orgs = organizations.slice(groupSize * 2);

  return (
    <motion.div
      className="flex w-full flex-col gap-4"
      initial={{ opacity: 1 }}
      animate={{
        opacity: isSearching ? 0 : 1,
        pointerEvents: isSearching ? "none" : "auto",
      }}
      transition={{ duration: 0.3 }}
    >
      {carousel1Orgs.length > 0 && (
        <Carousel
          organizations={carousel1Orgs}
          direction="left"
          onCardClick={onCardClick}
        />
      )}
      {carousel2Orgs.length > 0 && (
        <Carousel
          organizations={carousel2Orgs}
          direction="right"
          onCardClick={onCardClick}
        />
      )}
      {carousel3Orgs.length > 0 && (
        <Carousel
          organizations={carousel3Orgs}
          direction="left"
          onCardClick={onCardClick}
        />
      )}
    </motion.div>
  );
}
