import mongoose, { Schema, Document } from "mongoose";
import { User } from "@/lib/schemas";

// Extend the User type with Mongoose Document (omit _id to avoid conflicts)
export interface IUser extends Omit<User, "_id">, Document {}

// Define the Mongoose schema
const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      openEnded: { type: String },
      causes: [{ type: String }],
      helpMethod: [{ type: String }],
      changeScope: { type: String },
      location: { type: String },
    },
    likedOrganizations: [{ type: String }],
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
    collection: "users",
  },
);

// Create indexes for better query performance
UserSchema.index({ "preferences.causes": 1 });
UserSchema.index({ "preferences.changeScope": 1 });

// Create and export the model
const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
