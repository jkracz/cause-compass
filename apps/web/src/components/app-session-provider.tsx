"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import posthog from "posthog-js";
import { api } from "@cause/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type SessionContextValue = {
  guestId?: string;
  userId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  name?: string;
  email?: string;
  picture?: string;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function AuthLinker() {
  const session = useAppSession();
  const convexAuth = useConvexAuth();
  const linkGuestToAccount = useMutation(api.users.linkGuestToAccount);
  const lastAttemptRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    retryCountRef.current = 0;
    lastAttemptRef.current = null;

    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [session.guestId, session.userId]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      session.isLoading ||
      convexAuth.isLoading ||
      !session.isAuthenticated ||
      !convexAuth.isAuthenticated ||
      !session.userId
    ) {
      return;
    }

    const linkKey = [session.userId, session.guestId ?? ""].join(":");
    if (lastAttemptRef.current === linkKey) {
      return;
    }

    lastAttemptRef.current = linkKey;

    void linkGuestToAccount({
      guestId: session.guestId,
    })
      .then(() => {
        retryCountRef.current = 0;
      })
      .catch((error) => {
        const nextRetryCount = retryCountRef.current + 1;

        if (nextRetryCount > 5) {
          console.error("Failed to link guest session after retries", error);
          return;
        }

        retryCountRef.current = nextRetryCount;

        const retryDelayMs = Math.min(500 * 2 ** (nextRetryCount - 1), 5_000);
        console.error(
          `Failed to link guest session, retrying in ${retryDelayMs}ms`,
          error,
        );

        retryTimeoutRef.current = window.setTimeout(() => {
          lastAttemptRef.current = null;
          retryTimeoutRef.current = null;
          setRetryNonce((value) => value + 1);
        }, retryDelayMs);
      });
  }, [
    convexAuth.isAuthenticated,
    convexAuth.isLoading,
    linkGuestToAccount,
    retryNonce,
    session.guestId,
    session.isLoading,
    session.isAuthenticated,
    session.userId,
  ]);

  return null;
}

function AppSessionInner({
  children,
  initialGuestId,
}: {
  children: ReactNode;
  initialGuestId?: string;
}) {
  const { data: authSession, isPending: isSessionPending } =
    authClient.useSession();
  const convexAuth = useConvexAuth();
  const router = useRouter();

  const user = authSession?.user;
  const userId = user?.id ?? null;
  const isAuthenticated = convexAuth.isAuthenticated && Boolean(userId);

  const signIn = useCallback(async () => {
    await authClient.signIn.social({ provider: "google" });
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Unable to sign in");
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Unable to create account");
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
      await fetch("/api/guest-session", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Failed to sign out cleanly", error);
    } finally {
      posthog.reset();
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!initialGuestId) {
      return;
    }

    if (isAuthenticated && userId) {
      posthog.identify(userId, {
        email: user?.email,
        name: user?.name,
      });
      return;
    }

    posthog.identify(initialGuestId);
  }, [initialGuestId, isAuthenticated, user?.email, user?.name, userId]);

  const value = useMemo<SessionContextValue>(
    () => ({
      guestId: initialGuestId,
      userId,
      token: null,
      isLoading: isSessionPending || convexAuth.isLoading,
      isAuthenticated,
      name: user?.name,
      email: user?.email,
      picture: user?.image ?? undefined,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      convexAuth.isLoading,
      initialGuestId,
      isAuthenticated,
      isSessionPending,
      signIn,
      signInWithEmail,
      signOut,
      signUpWithEmail,
      user?.email,
      user?.image,
      user?.name,
      userId,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      <AuthLinker />
      {children}
    </SessionContext.Provider>
  );
}

export function AppSessionProvider({
  children,
  initialGuestId,
}: {
  children: ReactNode;
  initialGuestId?: string;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <AppSessionInner initialGuestId={initialGuestId}>
        {children}
      </AppSessionInner>
    </ConvexBetterAuthProvider>
  );
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }

  return context;
}
