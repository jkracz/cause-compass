"server-only";

import { z } from "zod";
import { connectToMongoDB } from "../connection";
import UserModel, { IUser } from "./model";
import { UserPreferencesSchema, UserPreferences } from "@/lib/schemas";

// Get user preferences
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  await connectToMongoDB();
  const result = (await UserModel.findOne({ userId })
    .select("preferences")
    .lean()
    .exec()) as { preferences: IUser["preferences"] } | null;

  if (!result) {
    return {};
  }
  const validatedPreferences = UserPreferencesSchema.parse(
    result.preferences || {},
  );

  return validatedPreferences;
}

// Get liked organizations for a user
export async function getLikedOrganizations(userId: string): Promise<string[]> {
  await connectToMongoDB();

  const result = (await UserModel.findOne({ userId })
    .select("likedOrganizations")
    .lean()
    .exec()) as { likedOrganizations: IUser["likedOrganizations"] } | null;

  const validatedLikedOrganizations = z
    .array(z.string())
    .parse(result?.likedOrganizations || []);

  return validatedLikedOrganizations;
}
