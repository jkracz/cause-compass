import { connectToMongoDB } from '../connection';
import UserPreferencesModel, { IUserPreferencesDocument, IUserPreferences } from '../models/User';

// Ensure database connection
async function ensureConnection() {
  await connectToMongoDB();
}

// Create or update user preferences
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<Omit<IUserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<IUserPreferencesDocument> {
  await ensureConnection();
  
  const existingPreferences = await UserPreferencesModel.findOne({ userId }).exec();
  
  if (existingPreferences) {
    // Update existing preferences
    Object.assign(existingPreferences, preferences);
    return await existingPreferences.save();
  } else {
    // Create new preferences
    const newPreferences = new UserPreferencesModel({
      userId,
      ...preferences
    });
    return await newPreferences.save();
  }
}

// Get user preferences by userId
export async function getUserPreferences(userId: string): Promise<IUserPreferencesDocument | null> {
  await ensureConnection();
  return await UserPreferencesModel.findOne({ userId }).exec();
}

// Update specific preference fields
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<IUserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<IUserPreferencesDocument | null> {
  await ensureConnection();
  return await UserPreferencesModel.findOneAndUpdate(
    { userId },
    { ...updates },
    { new: true, runValidators: true }
  ).exec();
}

// Delete user preferences
export async function deleteUserPreferences(userId: string): Promise<boolean> {
  await ensureConnection();
  const result = await UserPreferencesModel.deleteOne({ userId }).exec();
  return result.deletedCount > 0;
}

// Get all users with specific cause interests
export async function getUsersByCause(cause: string): Promise<IUserPreferencesDocument[]> {
  await ensureConnection();
  return await UserPreferencesModel.find({
    causes: { $in: [cause] }
  }).exec();
}

// Get all users by location preference
export async function getUsersByLocation(location: string): Promise<IUserPreferencesDocument[]> {
  await ensureConnection();
  return await UserPreferencesModel.find({ location }).exec();
}

// Get users by change scope preference
export async function getUsersByChangeScope(scope: 'local' | 'national' | 'global'): Promise<IUserPreferencesDocument[]> {
  await ensureConnection();
  return await UserPreferencesModel.find({ changeScope: scope }).exec();
}

// Get users by help method
export async function getUsersByHelpMethod(method: string): Promise<IUserPreferencesDocument[]> {
  await ensureConnection();
  return await UserPreferencesModel.find({
    helpMethod: { $in: [method] }
  }).exec();
}

// Get user statistics
export async function getUserPreferencesStats(): Promise<{
  totalUsers: number;
  topCauses: Array<{ cause: string; count: number }>;
  scopeDistribution: Array<{ scope: string; count: number }>;
  helpMethodDistribution: Array<{ method: string; count: number }>;
}> {
  await ensureConnection();
  
  const [
    totalUsers,
    causesAggregation,
    scopeAggregation,
    helpMethodAggregation
  ] = await Promise.all([
    UserPreferencesModel.countDocuments().exec(),
    
    UserPreferencesModel.aggregate([
      { $unwind: '$causes' },
      { $group: { _id: '$causes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).exec(),
    
    UserPreferencesModel.aggregate([
      { $match: { changeScope: { $ne: null } } },
      { $group: { _id: '$changeScope', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).exec(),
    
    UserPreferencesModel.aggregate([
      { $unwind: '$helpMethod' },
      { $group: { _id: '$helpMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).exec()
  ]);
  
  return {
    totalUsers,
    topCauses: causesAggregation.map(item => ({ 
      cause: item._id, 
      count: item.count 
    })),
    scopeDistribution: scopeAggregation.map(item => ({
      scope: item._id,
      count: item.count
    })),
    helpMethodDistribution: helpMethodAggregation.map(item => ({
      method: item._id,
      count: item.count
    }))
  };
}