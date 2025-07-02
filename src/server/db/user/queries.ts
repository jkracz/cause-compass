"server-only";

import { connectToMongoDB } from "../connection";
import UserModel, { IUser } from "./model";

// Get user preferences
export async function getUserPreferences(
  userId: string,
): Promise<IUser["preferences"]> {
  await connectToMongoDB();
  const user = await UserModel.findOne({ userId }).exec();
  return user?.preferences || {};
}

// Get liked organizations for a user
export async function getLikedOrganizations(userId: string): Promise<string[]> {
  await connectToMongoDB();

  const user = await UserModel.findOne({ userId })
    .select("likedOrganizations")
    .exec();
  return user?.likedOrganizations || [];
}
