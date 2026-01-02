"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchMutation } from "convex/nextjs";
import { api } from "@cause/backend/convex/_generated/api";
import { UserPreferences } from "@cause/types";
import { getPostHogClient, flushPostHog } from "@/lib/posthog-server";

export async function saveUserPreferences(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  // Extract preferences from form data
  const preferences: UserPreferences = {
    causes: formData.getAll("causes") as string[],
    location: formData.get("location") as string,
    helpMethod: formData.getAll("helpMethod") as string[],
    changeScope: formData.get("changeScope") as string,
    openEnded: {
      question: formData.get("openEnded") as string,
      answer: formData.get("openEndedAnswer") as string,
    },
  };

  try {
    // Save to Convex
    await fetchMutation(api.users.create, { userId, preferences });

    // Set a cookie to indicate preferences are saved
    cookieStore.set("hasPreferences", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
    });

    // Server-side PostHog tracking: identify user and capture preferences saved
    try {
      const posthog = getPostHogClient();
      posthog.identify({
        distinctId: userId,
        properties: {
          causes: preferences.causes,
          help_methods: preferences.helpMethod,
          change_scope: preferences.changeScope,
          has_location:
            preferences.location !== "skipped" &&
            preferences.location !== "denied",
        },
      });
      posthog.capture({
        distinctId: userId,
        event: "server_preferences_saved",
        properties: {
          causes_count: preferences.causes?.length ?? 0,
          help_methods_count: preferences.helpMethod?.length ?? 0,
          change_scope: preferences.changeScope,
          has_location:
            preferences.location !== "skipped" &&
            preferences.location !== "denied",
        },
      });
      // Flush events to ensure they're sent before redirect
      await flushPostHog();
    } catch (error) {
      // Log PostHog errors but don't abort the server action
      console.error("Error sending PostHog events:", error);
    }
  } catch (error) {
    console.error("Error saving user preferences:", error);
    throw new Error("Failed to save user preferences");
  }

  redirect("/discover");
}

export async function addLikedOrganization(organizationId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    await fetchMutation(api.users.addLikedOrganization, {
      userId,
      organizationId,
    });
    console.log("Successfully added liked organization:", organizationId);
    return { success: true };
  } catch (error) {
    console.error("Error adding liked organization:", error);
    throw new Error("Failed to add liked organization");
  }
}

export async function removeLikedOrganization(organizationId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    const result = await fetchMutation(api.users.removeLikedOrganization, {
      userId,
      organizationId,
    });
    // Convex already validates return types, so we can trust the result
    return result;
  } catch (error) {
    console.error("Error removing liked organization:", error);
    throw new Error("Failed to remove liked organization");
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (userId) {
    try {
      // Clear user data from Convex
      await fetchMutation(api.users.clearUserData, { userId });
      console.log("Successfully cleared user data for:", userId);
    } catch (error) {
      console.error("Error clearing user data:", error);
      // Continue with clearing cookies even if DB operation fails
    }
  }

  cookieStore.delete("userId");

  redirect("/");
}
