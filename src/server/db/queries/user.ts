import { connectToMongoDB } from '../connection';
import UserModel, { IUser } from '../models/User';

// Ensure database connection
async function ensureConnection() {
  await connectToMongoDB();
}

// Create or update user preferences
export async function saveUserPreferences(
  userId: string,
  preferences: {
    openEnded?: string;
    causes?: string[];
    helpMethod?: string[];
    changeScope?: string;
    location?: string;
  }
): Promise<IUser> {
  await ensureConnection();
  
  return await UserModel.findOneAndUpdate(
    { userId },
    { 
      userId,
      preferences 
    },
    { 
      new: true, 
      upsert: true, 
      runValidators: true 
    }
  ).exec();
}

// Get user preferences
export async function getUserPreferences(userId: string): Promise<IUser | null> {
  await ensureConnection();
  return await UserModel.findOne({ userId }).exec();
}

// Add a liked organization
export async function addLikedOrganization(
  userId: string, 
  organizationId: string
): Promise<IUser | null> {
  await ensureConnection();
  
  return await UserModel.findOneAndUpdate(
    { userId },
    { 
      $addToSet: { likedOrganizations: organizationId },
      $setOnInsert: { userId }
    },
    { 
      new: true, 
      upsert: true, 
      runValidators: true 
    }
  ).exec();
}

// Remove a liked organization
export async function removeLikedOrganization(
  userId: string, 
  organizationId: string
): Promise<IUser | null> {
  await ensureConnection();
  
  return await UserModel.findOneAndUpdate(
    { userId },
    { $pull: { likedOrganizations: organizationId } },
    { new: true }
  ).exec();
}

// Get liked organizations for a user
export async function getLikedOrganizations(userId: string): Promise<string[]> {
  await ensureConnection();
  
  const user = await UserModel.findOne({ userId }).select('likedOrganizations').exec();
  return user?.likedOrganizations || [];
}

// Clear all user data
export async function clearUserData(userId: string): Promise<boolean> {
  await ensureConnection();
  
  const result = await UserModel.deleteOne({ userId }).exec();
  return result.deletedCount > 0;
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
  }>
): Promise<IUser | null> {
  await ensureConnection();
  
  const updateObject: any = {};
  Object.keys(preferences).forEach(key => {
    updateObject[`preferences.${key}`] = preferences[key as keyof typeof preferences];
  });
  
  return await UserModel.findOneAndUpdate(
    { userId },
    { 
      $set: updateObject,
      $setOnInsert: { userId }
    },
    { 
      new: true, 
      upsert: true, 
      runValidators: true 
    }
  ).exec();
}