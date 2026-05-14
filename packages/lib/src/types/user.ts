import * as z from "zod";

export const UserSchema = z.object({
  userId: z.string().optional(),
  guestId: z.string().optional(),
  likedOrganizations: z.array(z.string()),
  profile: z
    .object({
      email: z.string().optional(),
      name: z.string().optional(),
      picture: z.string().optional(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
