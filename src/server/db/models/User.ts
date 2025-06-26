import mongoose, { Document, Schema } from 'mongoose';

// User preferences interface
export interface IUserPreferences {
  userId: string;
  causes: string[];
  location: string | null;
  donationRange: string | null;
  involvement: string | null;
  helpMethod: string[];
  changeScope: string | null;
  openEnded: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferencesDocument extends IUserPreferences, Document {}

// User preferences schema
const UserPreferencesSchema = new Schema<IUserPreferencesDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    causes: {
      type: [String],
      default: [],
      enum: [
        'environment',
        'education', 
        'health',
        'poverty',
        'rights',
        'arts',
        'animals',
        'disaster',
        'mental-health',
        'food',
        'technology',
        'community'
      ]
    },
    location: {
      type: String,
      default: null,
    },
    donationRange: {
      type: String,
      default: null,
    },
    involvement: {
      type: String,
      default: null,
    },
    helpMethod: {
      type: [String],
      default: [],
      enum: [
        'donating',
        'volunteering',
        'sharing',
        'connecting',
        'learning'
      ]
    },
    changeScope: {
      type: String,
      default: null,
      enum: ['local', 'national', 'global', null]
    },
    openEnded: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
    collection: 'user_preferences'
  }
);

// Create indexes for better query performance
UserPreferencesSchema.index({ userId: 1 });
UserPreferencesSchema.index({ causes: 1 });
UserPreferencesSchema.index({ changeScope: 1 });
UserPreferencesSchema.index({ createdAt: -1 });

// Export the model
const UserPreferencesModel = mongoose.model<IUserPreferencesDocument>('UserPreferences', UserPreferencesSchema);

export default UserPreferencesModel;