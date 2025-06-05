"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface MosaicPieceProps {
  index: number;
  total: number;
  isCompleted: boolean;
}

export function MosaicPiece({ index, total, isCompleted }: MosaicPieceProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate position based on index and total
  const angle = (index / total) * 2 * Math.PI;
  const radius = 60; // Distance from center
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  // Generate sophisticated colors matching the new palette
  const colorPalettes = [
    ["#FF1493", "#8A2BE2", "#4B0082"], // Pink to Purple
    ["#00BFFF", "#1E90FF", "#4169E1"], // Blue spectrum
    ["#00FF7F", "#2ECC71", "#1ABC9C"], // Green/Teal
    ["#FFA500", "#FF4500", "#FF1493"], // Orange to Pink
    ["#BA55D3", "#9370DB", "#7B68EE"], // Purple spectrum
    ["#FF69B4", "#FF1493", "#C71585"], // Hot pink spectrum
  ];

  const palette = colorPalettes[index % colorPalettes.length];
  const color = palette[Math.floor(Math.random() * palette.length)];

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
        opacity: isCompleted ? 1 : 0.3,
        scale: isCompleted ? 1 : 0.8,
        rotate: isCompleted ? index * 45 : 0,
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
                stopColor={isCompleted ? color : "rgba(255, 255, 255, 0.1)"}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={
                  isCompleted ? palette[1] : "rgba(255, 255, 255, 0.05)"
                }
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
            stroke={isCompleted ? color : "rgba(255, 255, 255, 0.2)"}
            strokeWidth="1"
            filter={isCompleted ? `url(#glow-${index})` : "none"}
            className="transition-all duration-300"
          />

          {/* Inner accent triangle */}
          {isCompleted && (
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
