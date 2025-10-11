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
  userId: z.string(),
  preferences: UserPreferencesSchema,
  likedOrganizations: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type User = z.infer<typeof UserSchema>;
