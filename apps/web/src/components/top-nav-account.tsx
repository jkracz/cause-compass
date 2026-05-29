"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, LocateFixed, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountAvatar } from "@/components/account-avatar";
import { useAppSession } from "@/components/app-session-provider";
import { useLocationPreference } from "@/components/location-preference-provider";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

const AccountAuthDialog = dynamic(
  () =>
    import("@/components/account-auth-dialog").then(
      (mod) => mod.AccountAuthDialog,
    ),
  { ssr: false },
);

export function TopNavAccount() {
  const session = useAppSession();
  const locationPreference = useLocationPreference();
  const [isAccountAuthOpen, setIsAccountAuthOpen] = useState(false);
  const activeState = locationPreference.activeState;
  const isLocationActive = Boolean(activeState);
  const isLocating = locationPreference.status === "locating";

  return (
    <>
      {session.isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--rule)] bg-white/80 transition hover:bg-white"
              aria-label="Open account menu"
            >
              <span className="overflow-hidden rounded-full">
                <AccountAvatar
                  picture={session.picture}
                  name={session.name}
                  email={session.email}
                  size={40}
                  textClassName="text-sm font-semibold text-[var(--ink)]"
                />
              </span>
              {isLocationActive && (
                <span
                  aria-hidden
                  className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--paper)] bg-[var(--accent)] text-[var(--paper)] shadow-[0_6px_14px_-8px_rgba(200,38,110,0.85)]"
                >
                  <LocateFixed className="h-3 w-3" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 border-[var(--rule)] bg-white text-[var(--ink)] backdrop-blur-xl"
          >
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--rule)] bg-[var(--paper-deep)]">
                  <AccountAvatar
                    picture={session.picture}
                    name={session.name}
                    email={session.email}
                    size={44}
                    textClassName="text-base font-semibold text-[var(--ink)]"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {session.name || "Signed in"}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-mute)]">
                    {session.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--rule)]" />
            <div className="px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--ink-mute)] uppercase">
                  Location
                </p>
                {activeState && (
                  <p className="truncate text-xs text-[var(--ink-soft)]">
                    {activeState.source === "browser" ? "Current" : "Manual"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="account-location-state" className="sr-only">
                  Location state
                </label>
                <select
                  id="account-location-state"
                  value={activeState?.stateCode ?? ""}
                  onChange={(event) => {
                    if (event.target.value) {
                      locationPreference.setManualState(event.target.value);
                      return;
                    }
                    locationPreference.turnOff();
                  }}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--rule)] bg-white px-3 text-sm text-[var(--ink)] transition outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/15"
                >
                  <option value="">No state selected</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (isLocationActive) {
                      locationPreference.turnOff();
                      return;
                    }
                    void locationPreference.useBrowserLocation();
                  }}
                  disabled={isLocating}
                  title={
                    isLocationActive ? "Disable location" : "Enable location"
                  }
                  aria-label={
                    isLocationActive ? "Disable location" : "Enable location"
                  }
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition focus-visible:border-[var(--accent)]/50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/15 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
                    isLocationActive
                      ? "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--rule)] bg-white text-[var(--ink-mute)] hover:border-[var(--accent)]/35 hover:text-[var(--accent)]",
                  )}
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {locationPreference.errorMessage && (
                <p className="mt-1.5 text-xs leading-5 text-[var(--ink-soft)]">
                  {locationPreference.errorMessage}
                </p>
              )}
            </div>
            <DropdownMenuSeparator className="bg-[var(--rule)]" />
            <DropdownMenuItem
              onSelect={() => void session.signOut()}
              className="text-[var(--ink-soft)] focus:bg-[var(--paper-deep)] focus:text-[var(--accent)]"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          onClick={() => setIsAccountAuthOpen(true)}
          className="inline-flex h-9 cursor-pointer items-center gap-2.5 rounded-full border-none bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition-shadow hover:shadow-md active:shadow-none"
        >
          Sign in
        </button>
      )}

      {isAccountAuthOpen && (
        <AccountAuthDialog
          open={isAccountAuthOpen}
          onOpenChange={setIsAccountAuthOpen}
        />
      )}
    </>
  );
}
