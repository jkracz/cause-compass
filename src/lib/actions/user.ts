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

  // Extract preferences from form data
  const preferences = {
    causes: formData.getAll("causes"),
    location: formData.get("location"),
    donationRange: formData.get("donationRange"),
    involvement: formData.get("involvement"),
  };

  // TODO: Save to MongoDB
  console.log("Saving preferences for user:", userId, preferences);

  // Set a cookie to indicate preferences are saved
  cookieStore.set("hasPreferences", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/discover");
}

export async function clearUserSession() {
  const cookieStore = await cookies();

  cookieStore.delete("userId");
  cookieStore.delete("hasPreferences");
  cookieStore.delete("hasVisited");

  redirect("/");
}
