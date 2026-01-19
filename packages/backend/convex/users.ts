import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Validator for user preferences
const userPreferencesValidator = v.object({
  causes: v.optional(v.array(v.string())),
  helpMethod: v.optional(v.array(v.string())),
  changeScope: v.optional(v.string()),
  location: v.optional(v.string()),
  openEnded: v.optional(
    v.object({
      question: v.string(),
      answer: v.optional(v.string()),
    }),
  ),
});

// User document validator
const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  userId: v.string(),
  preferences: userPreferencesValidator,
  likedOrganizations: v.array(v.string()),
});

// Get user by userId
export const getOne = query({
  args: { userId: v.string() },
  returns: v.union(userValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Create or update user with preferences (upsert)
export const create = mutation({
  args: {
    userId: v.string(),
    preferences: userPreferencesValidator,
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        preferences: args.preferences,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        userId: args.userId,
        preferences: args.preferences,
        likedOrganizations: [],
      });
    }
  },
});

// Add a liked organization
export const addLikedOrganization = mutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      // Create user if doesn't exist
      return await ctx.db.insert("users", {
        userId: args.userId,
        preferences: {},
        likedOrganizations: [args.organizationId],
      });
    }

    // Add organization if not already liked
    if (!user.likedOrganizations.includes(args.organizationId)) {
      await ctx.db.patch(user._id, {
        likedOrganizations: [...user.likedOrganizations, args.organizationId],
      });
    }

    return user._id;
  },
});

// Remove a liked organization
export const removeLikedOrganization = mutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
  },
  returns: v.union(userValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    const updatedLikedOrgs = user.likedOrganizations.filter(
      (id: string) => id !== args.organizationId,
    );

    await ctx.db.patch(user._id, {
      likedOrganizations: updatedLikedOrgs,
    });

    return {
      ...user,
      likedOrganizations: updatedLikedOrgs,
    };
  },
});

// Clear all user data
export const clearUserData = mutation({
  args: { userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
      return true;
    }

    return false;
  },
});
