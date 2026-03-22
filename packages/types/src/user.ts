import * as z from "zod";

export const OpenEndedQuestionSchema = z.object({
  question: z.string(),
  answer: z.string().optional(),
});

export const UserPreferencesSchema = z.object({
  openEnded: OpenEndedQuestionSchema.optional(),
  causes: z.array(z.string()).optional(),
  helpMethod: z.array(z.string()).optional(),
  changeScope: z.string().optional(),
  location: z.string().optional(),
});

export const UserSchema = z.object({
  userId: z.string().optional(),
  guestId: z.string().optional(),
  preferences: UserPreferencesSchema,
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

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type User = z.infer<typeof UserSchema>;
