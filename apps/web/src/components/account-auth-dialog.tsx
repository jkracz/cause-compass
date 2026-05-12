"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSession } from "@/components/app-session-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AccountAuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const session = useAppSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGoogle = async () => {
    setIsGoogleSubmitting(true);
    try {
      await session.signIn();
    } catch (error) {
      toast.error("Google sign-in failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await session.signUpWithEmail(email, password, name.trim() || email);
      } else {
        await session.signInWithEmail(email, password);
      }
      onOpenChange(false);
      setPassword("");
    } catch (error) {
      toast.error(mode === "signup" ? "Sign up failed" : "Sign in failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription className="text-white/60">
            {mode === "signup"
              ? "Create an account to save your causes across devices."
              : "Sign in to return to your saved causes."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 rounded-md border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "h-9 rounded-sm text-sm font-medium text-white/70 transition",
              mode === "signin" && "bg-white text-neutral-900",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "h-9 rounded-sm text-sm font-medium text-white/70 transition",
              mode === "signup" && "bg-white text-neutral-900",
            )}
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={isGoogleSubmitting}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border-none bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGoogleSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
        </button>

        <div className="flex items-center gap-3 text-xs text-white/45">
          <div className="h-px flex-1 bg-white/10" />
          or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="grid gap-1.5 text-sm text-white/80">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="h-10 rounded-md border border-white/10 bg-white/10 px-3 text-white transition outline-none placeholder:text-white/35 focus:border-white/40"
              />
            </label>
          )}
          <label className="grid gap-1.5 text-sm text-white/80">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="h-10 rounded-md border border-white/10 bg-white/10 px-3 text-white transition outline-none placeholder:text-white/35 focus:border-white/40"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-white/80">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="h-10 rounded-md border border-white/10 bg-white/10 px-3 text-white transition outline-none placeholder:text-white/35 focus:border-white/40"
            />
          </label>
          <Button type="submit" disabled={isSubmitting} className="mt-1 h-10">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "Create Account" : "Sign in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
