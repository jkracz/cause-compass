// import { query } from "./_generated/server";
// import { v } from "convex/values";

// export const likedByUser = query({
//   args: { userId: v.string() },
//   handler: async (ctx, { userId }) => {
//     const user = await ctx.db
//       .query("users")
//       .withIndex("by_userId", (q) => q.eq("userId", userId))
//       .unique();

//     if (!user || user.likedOrganizations.length === 0) {
//       return [];
//     }

//     const orgs = await Promise.all(
//       user.likedOrganizations.map((orgId) =>
//         ctx.db
//           .query("organizations")
//           .withIndex("by_dbId", (q) => q.eq("dbId", orgId))
//           .first(),
//       ),
//     );

//     // Optional: filter nulls if orgs can be deleted
//     return orgs.filter(Boolean);
//   },
// });
