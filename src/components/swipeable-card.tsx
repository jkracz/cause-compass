"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { Heart, X } from "lucide-react";
import Image from "next/image";

import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { Cause } from "@/lib/schemas";

interface SwipeableCardProps {
  organization: Cause;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeableCard({
  organization,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableCardProps) {
  const [exitX, setExitX] = useState<number | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Get display data with fallbacks
  const displayLocation =
    organization.city && organization.state
      ? `${organization.city}, ${organization.state}`
      : undefined;
  const displayTagline =
    organization.tagline ||
    organization.mission ||
    organization.whySupport ||
    organization.uniqueTrait;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x > 100) {
      setExitX(200);
      setTimeout(() => onSwipeRight(), 200);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      setTimeout(() => onSwipeLeft(), 200);
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        width: "100%",
        height: "100%",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== null ? { x: exitX, opacity: 0 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <GlassmorphicCard
        variant="swipe"
        className="flex h-full flex-col justify-center overflow-hidden p-8"
      >
        {/* Floating Logo */}
        <div className="absolute top-8 left-1/2 z-10 -translate-x-1/2 transform">
          {organization.logoUrl ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-white/30 backdrop-blur-sm">
              <Image
                src={organization.logoUrl || "/placeholder.svg"}
                alt={`${organization.name} logo`}
                fill
                sizes="(max-width: 768px) 128px, 128px"
                className="object-contain p-2"
                onError={(e) => {
                  // Fallback to initials if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
                unoptimized
              />
            </div>
          ) : (
            // Fallback visual with organization initials
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl ring-4 ring-white/30">
              <span className="text-3xl font-bold">
                {organization.name
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-4 pt-32 text-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold">{organization.name}</h2>
            {displayLocation && <p className="text-lg">{displayLocation}</p>}
          </div>

          {displayTagline && (
            <div className="px-4">
              <p className="text-base leading-relaxed">{displayTagline}</p>
            </div>
          )}
        </div>

        <motion.div
          className="absolute top-4 left-4 rounded-full bg-white p-2"
          style={{ opacity: nopeOpacity }}
        >
          <X className="h-8 w-8 text-red-500" />
        </motion.div>

        <motion.div
          className="absolute top-4 right-4 rounded-full bg-white p-2"
          style={{ opacity: likeOpacity }}
        >
          <Heart className="h-8 w-8 text-pink-500" />
        </motion.div>
      </GlassmorphicCard>
    </motion.div>
  );
}
