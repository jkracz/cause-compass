"server-only";

import { z } from "zod";
import { connectToMongoDB } from "../connection";
import UserModel, { IUser } from "./model";
import { UserPreferencesSchema, UserPreferences, Cause } from "@/lib/schemas";
import { getCausesByDbIds } from "../organization/queries";

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
export async function getLikedCauses(userId: string): Promise<Cause[]> {
  await connectToMongoDB();

  const result = (await UserModel.findOne({ userId })
    .select("likedOrganizations")
    .lean()
    .exec()) as { likedOrganizations: IUser["likedOrganizations"] } | null;

  const likedCauses = z
    .array(z.string())
    .parse(result?.likedOrganizations || []);

  return await getCausesByDbIds(likedCauses);
}
