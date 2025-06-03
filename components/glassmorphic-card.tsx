import type React from "react"
import { cn } from "@/lib/utils"

interface GlassmorphicCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "swipe"
}

export function GlassmorphicCard({ children, className, variant = "default" }: GlassmorphicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl backdrop-blur-md border shadow-lg",
        variant === "swipe" ? "bg-white/5 p-0 border-white/10 shadow-2xl" : "bg-white/10 p-6 border-white/20 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  )
}
