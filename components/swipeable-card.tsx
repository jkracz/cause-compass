"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Heart, X } from "lucide-react";

import { GlassmorphicCard } from "@/components/glassmorphic-card";
import type { Organization } from "@/lib/types";

interface SwipeableCardProps {
  organization: Organization;
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

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      setExitX(200);
      onSwipeRight();
    } else if (info.offset.x < -100) {
      setExitX(-200);
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== null ? { x: exitX } : undefined}
      transition={{ duration: 0.2 }}
    >
      <GlassmorphicCard
        variant="swipe"
        className="flex h-full flex-col justify-center overflow-hidden p-8"
      >
        <div className="space-y-4 text-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-white">
              {organization.name}
            </h2>
            <p className="text-lg text-white/70">{organization.location}</p>
          </div>

          <div className="px-4">
            <p className="text-base leading-relaxed text-white/90">
              {organization.description}
            </p>
          </div>
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
