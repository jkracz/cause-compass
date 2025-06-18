"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
}

export function BackButton({
  fallbackHref = "/",
  label = "Back",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in history, fallback to provided href
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      // className="mb-6 text-white/70 hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
