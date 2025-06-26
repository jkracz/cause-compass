import { z } from 'zod';

// User preference validation schemas
export const UserPreferencesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  causes: z.array(z.enum([
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
  ])).default([]),
  location: z.string().nullable().optional(),
  donationRange: z.string().nullable().optional(),
  involvement: z.string().nullable().optional(),
  helpMethod: z.array(z.enum([
    'donating',
    'volunteering',
    'sharing',
    'connecting',
    'learning'
  ])).default([]),
  changeScope: z.enum(['local', 'national', 'global']).nullable().optional(),
  openEnded: z.string().nullable().optional(),
});

// Schema for creating user preferences
export const CreateUserPreferencesSchema = UserPreferencesSchema.omit({
  userId: true
});

// Schema for updating user preferences
export const UpdateUserPreferencesSchema = UserPreferencesSchema.partial().omit({
  userId: true
});

// Schema for form data validation
export const UserPreferencesFormSchema = z.object({
  causes: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.string().optional(),
  donationRange: z.string().optional(),
  involvement: z.string().optional(),
  helpMethod: z.union([z.string(), z.array(z.string())]).optional(),
  changeScope: z.string().optional(),
  openEnded: z.string().optional(),
});

// Types
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type CreateUserPreferences = z.infer<typeof CreateUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof UpdateUserPreferencesSchema>;
export type UserPreferencesForm = z.infer<typeof UserPreferencesFormSchema>;