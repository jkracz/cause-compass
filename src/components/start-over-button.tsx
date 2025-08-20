"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
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

export function StartOverButton() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleStartOver = () => {
    console.log("start over");
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
            This will clear all your saved organizations and preferences. You'll
            be able to answer the mirror questions again and start fresh. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStartOver}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
