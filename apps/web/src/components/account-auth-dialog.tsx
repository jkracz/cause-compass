"use client";

import { FormEvent, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppSession } from "@/components/app-session-provider";
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

  const submitting = isSubmitting || isGoogleSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-0! bg-transparent! p-0! shadow-none! outline-none focus:outline-none focus-visible:outline-none sm:max-w-md"
      >
        <div
          className="relative overflow-hidden rounded-[28px] border border-[var(--rule)] bg-[var(--card)] text-[var(--ink)]"
          style={{
            boxShadow: "0 24px 60px -24px rgba(91, 75, 158, 0.35)",
          }}
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-[var(--ink-mute)] transition-colors hover:bg-[var(--paper-deep)] hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        <div className="px-7 pt-8 pb-6">
          <DialogHeader className="gap-3">
            <div className="text-[11px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
              Cause Compass
            </div>
            <DialogTitle
              className="font-[family-name:var(--font-bitter)] text-[28px] leading-[1.05] font-semibold tracking-[-0.005em] text-[var(--ink)]"
            >
              {mode === "signup" ? "Start your collection" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {mode === "signup"
                ? "Save the causes that resonate and keep them with you across devices."
                : "Return to the causes you've saved."}
            </DialogDescription>
          </DialogHeader>

          <div
            role="tablist"
            aria-label="Account mode"
            className="mt-7 flex gap-7 border-b border-[var(--rule)]"
          >
            {(["signin", "signup"] as const).map((value) => {
              const isActive = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(value)}
                  className={cn(
                    "relative -mb-px cursor-pointer pb-3 text-[11px] font-semibold tracking-[0.32em] uppercase transition-colors duration-200",
                    isActive
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-mute)] hover:text-[var(--ink-soft)]",
                  )}
                >
                  {value === "signin" ? "Sign in" : "Sign up"}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute right-0 -bottom-px left-0 h-[2px] origin-left bg-[var(--accent)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-5">
            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={submitting}
              className={cn(
                "group inline-flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[var(--rule)] bg-[var(--card)] px-5 text-sm font-medium text-[var(--ink-soft)] transition-all duration-200",
                "hover:border-[color-mix(in_oklch,var(--accent)_45%,var(--rule))] hover:bg-[var(--accent-soft)]/40 hover:text-[var(--ink)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {isGoogleSubmitting ? (
                <Loader2 className="size-4 animate-spin text-[var(--ink-mute)]" />
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
              Continue with Google
            </button>

            <div
              aria-hidden="true"
              className="flex items-center gap-4 text-[10px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase"
            >
              <span className="h-px flex-1 bg-[var(--rule)]" />
              or
              <span className="h-px flex-1 bg-[var(--rule)]" />
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <Field
                  label="Name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}
              <Field
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={setEmail}
              />
              <Field
                label="Password"
                type="password"
                required
                minLength={8}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={setPassword}
              />

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "group relative mt-2 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--ink)] px-6 text-[11px] font-semibold tracking-[0.32em] text-[var(--paper)] uppercase transition-all duration-200",
                  "hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--ink)] disabled:hover:shadow-none",
                )}
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-[var(--rule)] bg-[var(--paper)]/60 px-7 py-4 text-center text-[13px] text-[var(--ink-soft)]">
          {mode === "signup" ? (
            <>
              Already keeping a notebook?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="cursor-pointer font-medium text-[var(--accent)] underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="cursor-pointer font-medium text-[var(--accent)] underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Start your collection
              </button>
            </>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className={cn(
          "h-11 rounded-xl border border-[var(--rule)] bg-[var(--card)] px-4 text-[15px] text-[var(--ink)] transition-all duration-200 outline-none",
          "placeholder:text-[var(--ink-mute)]",
          "hover:border-[var(--rule-strong)]",
          "focus:border-[color-mix(in_oklch,var(--accent)_55%,var(--rule))] focus:shadow-[0_0_0_4px_rgba(200,38,110,0.12),0_18px_50px_-30px_rgba(200,38,110,0.45)]",
        )}
      />
    </label>
  );
}
