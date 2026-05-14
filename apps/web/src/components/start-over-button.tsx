"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useResetJourney } from "@/hooks/use-reset-journey";

export function StartOverButton() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { isAuthenticated, isPending, resetJourney } = useResetJourney();

  const handleStartOver = async () => {
    await resetJourney();
    setIsResetDialogOpen(false);
  };

  return (
    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-950/30"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Your Journey?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAuthenticated
              ? "This will clear your saved and skipped organizations from your account."
              : "This will clear your saved and skipped organizations in this browser."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            onClick={() => void handleStartOver()}
            variant="destructive"
            disabled={isPending}
          >
            {isPending ? "Clearing..." : "Clear Journey"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
