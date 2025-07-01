"server-only";

import { connectToMongoDB } from "../connection";
import UserModel, { IUser } from "./model";

// Add a liked organization
export async function addLikedOrganization(
  userId: string,
  organizationId: string,
): Promise<IUser | null> {
  await connectToMongoDB();

  return await UserModel.findOneAndUpdate(
    { userId },
    {
      $addToSet: { likedOrganizations: organizationId },
      $setOnInsert: { userId },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).exec();
}

// Remove a liked organization
export async function removeLikedOrganization(
  userId: string,
  organizationId: string,
): Promise<IUser | null> {
  await connectToMongoDB();

  return await UserModel.findOneAndUpdate(
    { userId },
    { $pull: { likedOrganizations: organizationId } },
    { new: true },
  ).exec();
}

// Clear all user data
export async function clearUserData(userId: string): Promise<boolean> {
  await connectToMongoDB();

  const result = await UserModel.deleteOne({ userId }).exec();
  return result.deletedCount > 0;
}

// Create or update user with preferences
export async function saveUserPreferences(
  userId: string,
  preferences: {
    openEnded?: string;
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
  },
): Promise<IUser> {
  await connectToMongoDB();

  return await UserModel.findOneAndUpdate(
    { userId },
    {
      userId,
      preferences,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).exec();
}

// Update user preferences (partial update)
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<{
    openEnded?: string;
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
  }>,
): Promise<IUser | null> {
  await connectToMongoDB();

  const updateObject: any = {};
  Object.keys(preferences).forEach((key) => {
    updateObject[`preferences.${key}`] =
      preferences[key as keyof typeof preferences];
  });

  return await UserModel.findOneAndUpdate(
    { userId },
    {
      $set: updateObject,
      $setOnInsert: { userId },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).exec();
}
