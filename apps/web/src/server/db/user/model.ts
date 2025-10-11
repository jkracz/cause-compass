import mongoose, { Schema, Document } from "mongoose";
import { User } from "@cause/types";

// Align the Mongoose document with the Zod user type (mongoose adds timestamps itself)
export interface IUser
  extends Document,
    Omit<User, "createdAt" | "updatedAt"> {}

// Define the Mongoose schema that matches the Zod schema structure
const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      type: {
        openEnded: {
          question: { type: String },
          answer: { type: String },
        },
        causes: [{ type: String }],
        helpMethod: [{ type: String }],
        changeScope: { type: String },
        location: { type: String },
      },
      default: {},
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
const UserModel: mongoose.Model<IUser> = mongoose.models.User
  ? mongoose.model<IUser>("User")
  : mongoose.model<IUser>("User", UserSchema);

export default UserModel;
