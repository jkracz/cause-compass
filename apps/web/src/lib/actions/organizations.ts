"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function likeOrganization(orgId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  // TODO: Save to MongoDB - user's liked organizations
  console.log("User", userId, "liked organization", orgId);

  // Revalidate the discover page to update the UI
  revalidatePath("/discover");
}

export async function skipOrganization(orgId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  // TODO: Save to MongoDB - user's skipped organizations
  console.log("User", userId, "skipped organization", orgId);

  revalidatePath("/discover");
}

export async function removeOrganization(orgId: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("No user session found");
  }

  // TODO: Remove from MongoDB - user's liked organizations
  console.log("User", userId, "removed organization", orgId);

  revalidatePath("/my-causes");
}
