import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    preferences: v.object({
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
    }),
    likedOrganizations: v.array(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_likedOrganizations", ["likedOrganizations"]),
});
