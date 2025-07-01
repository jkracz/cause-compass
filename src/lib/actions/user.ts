"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  saveUserPreferences as saveUserPreferencesDB,
  addLikedOrganization as addLikedOrganizationDB,
  removeLikedOrganization as removeLikedOrganizationDB,
  clearUserData,
  updateUserPreferences as updateUserPreferencesDB,
} from "@/server/db/user/mutations";
import { UserPreferences } from "@/lib/schemas";

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
    donationRange: formData.get("donationRange") as string,
    involvement: formData.get("involvement") as string,
    helpMethod: formData.getAll("helpMethod") as string[],
    changeScope: formData.get("changeScope") as string,
    openEnded: formData.get("openEnded") as string,
  };

  try {
    // Save to MongoDB
    await saveUserPreferencesDB(userId, preferences);
    console.log("Successfully saved preferences for user:", userId);

    // Set a cookie to indicate preferences are saved
    cookieStore.set("hasPreferences", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
    });

    redirect("/discover");
  } catch (error) {
    console.error("Error saving user preferences:", error);
    throw new Error("Failed to save user preferences");
  }
}

export async function addLikedOrganization(organizationId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    await addLikedOrganizationDB(userId, organizationId);
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
    await removeLikedOrganizationDB(userId, organizationId);
    console.log("Successfully removed liked organization:", organizationId);
    return { success: true };
  } catch (error) {
    console.error("Error removing liked organization:", error);
    throw new Error("Failed to remove liked organization");
  }
}

export async function updateUserPreferences(
  preferences: Partial<{
    openEnded?: string;
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
  }>,
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    await updateUserPreferencesDB(userId, preferences);
    console.log("Successfully updated preferences for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw new Error("Failed to update user preferences");
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (userId) {
    try {
      // Clear user data from database
      await clearUserData(userId);
      console.log("Successfully cleared user data for:", userId);
    } catch (error) {
      console.error("Error clearing user data:", error);
      // Continue with clearing cookies even if DB operation fails
    }
  }

  cookieStore.delete("userId");
  cookieStore.delete("hasPreferences");

  redirect("/");
}
