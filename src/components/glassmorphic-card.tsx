import type React from "react";
import { cn } from "@/lib/utils";

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "swipe";
}

export function GlassmorphicCard({
  children,
  className,
  variant = "default",
}: GlassmorphicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border shadow-lg backdrop-blur-md",
        variant === "swipe"
          ? "border-white/10 bg-white/5 p-0 shadow-2xl"
          : "border-white/20 bg-white/10 p-6 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
