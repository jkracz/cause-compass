"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export async function createUserSession() {
  const cookieStore = await cookies();
  const userId = nanoid();

  cookieStore.set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return userId;
}

export async function saveUserPreferences(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    // Process form data using utility function
    const { processPreferencesFormData } = await import("@/lib/utils/preferences");
    const preferences = processPreferencesFormData(formData);

    // Import the database function dynamically to avoid issues with server/client boundaries
    const { saveUserPreferences: saveToDb } = await import("@/server/db/queries/user");
    
    // Save to MongoDB
    await saveToDb(userId, preferences);

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

export async function getUserPreferences() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return null;
  }

  try {
    const { getUserPreferences: getFromDb } = await import("@/server/db/queries/user");
    return await getFromDb(userId);
  } catch (error) {
    console.error("Error getting user preferences:", error);
    return null;
  }
}

export async function updateUserPreferences(updates: Record<string, any>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  try {
    const { updateUserPreferences: updateInDb } = await import("@/server/db/queries/user");
    return await updateInDb(userId, updates);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw new Error("Failed to update user preferences");
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  // If user has preferences, delete them from database
  if (userId) {
    try {
      const { deleteUserPreferences } = await import("@/server/db/queries/user");
      await deleteUserPreferences(userId);
    } catch (error) {
      console.error("Error deleting user preferences:", error);
      // Continue with clearing session even if DB delete fails
    }
  }

  cookieStore.delete("userId");
  cookieStore.delete("hasPreferences");
  cookieStore.delete("hasVisited");

  redirect("/");
}
