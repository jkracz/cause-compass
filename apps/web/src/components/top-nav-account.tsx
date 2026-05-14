"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountAvatar } from "@/components/account-avatar";
import { useAppSession } from "@/components/app-session-provider";

const AccountAuthDialog = dynamic(
  () =>
    import("@/components/account-auth-dialog").then(
      (mod) => mod.AccountAuthDialog,
    ),
  { ssr: false },
);

export function TopNavAccount() {
  const session = useAppSession();
  const [isAccountAuthOpen, setIsAccountAuthOpen] = useState(false);

  return (
    <>
      {session.isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--rule)] bg-white/80 transition hover:bg-white"
              aria-label="Open account menu"
            >
              <AccountAvatar
                picture={session.picture}
                name={session.name}
                email={session.email}
                size={40}
                textClassName="text-sm font-semibold text-[var(--ink)]"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 border-[var(--rule)] bg-white text-[var(--ink)] backdrop-blur-xl"
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--rule)] bg-[var(--paper-deep)]">
                  <AccountAvatar
                    picture={session.picture}
                    name={session.name}
                    email={session.email}
                    size={48}
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
