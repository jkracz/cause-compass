"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface MosaicPieceProps {
  index: number;
  total: number;
  isActive: boolean;
}

const colorPalettes = [
  ["#FF1493", "#8A2BE2", "#4B0082"], // Pink to Purple
  ["#00BFFF", "#1E90FF", "#4169E1"], // Blue spectrum
  ["#00FF7F", "#2ECC71", "#1ABC9C"], // Green/Teal
  ["#FFA500", "#FF4500", "#FF1493"], // Orange to Pink
  ["#BA55D3", "#9370DB", "#7B68EE"], // Purple spectrum
  ["#FF69B4", "#FF1493", "#C71585"], // Hot pink spectrum
];

export function MosaicPiece({ index, total, isActive }: MosaicPieceProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is intentional - we need to track when component mounts for SSR hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Calculate position based on index and total
  const angle = (index / total) * 2 * Math.PI;
  const radius = 60; // Distance from center
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  const palette = colorPalettes[index % colorPalettes.length]!;
  // Use index to deterministically select a color (avoiding Math.random during render)
  const colorIndex = index % palette.length;
  const color = palette[colorIndex]!;

  if (!mounted) return null;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "48px",
        height: "48px",
      }}
      initial={{
        x: 0,
        y: 0,
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        x,
        y,
        opacity: isActive ? 1 : 0.6,
        scale: isActive ? 1 : 0.85,
        rotate: isActive ? index * 45 : 0,
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      {/* Triangular mosaic piece */}
      <div className="relative h-full w-full">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={isActive ? color : "rgba(255, 255, 255, 0.25)"}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={isActive ? palette[1] : "rgba(255, 255, 255, 0.15)"}
                stopOpacity="0.4"
              />
            </linearGradient>
            <filter id={`glow-${index}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main triangle */}
          <polygon
            points="24,6 42,36 6,36"
            fill={`url(#gradient-${index})`}
            stroke={isActive ? color : "rgba(255, 255, 255, 0.4)"}
            strokeWidth="1"
            filter={isActive ? `url(#glow-${index})` : "none"}
            className="transition-all duration-300"
          />

          {/* Inner accent triangle */}
          {isActive && (
            <polygon
              points="24,12 36,30 12,30"
              fill="none"
              stroke={palette[2]}
              strokeWidth="0.5"
              opacity="0.6"
            />
          )}
        </svg>
      </div>
    </motion.div>
  );
}
