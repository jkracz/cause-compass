# Cause Compass

A Next.js application that helps users discover and connect with organizations that match their values and interests.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Type System & Schema Management

This project uses a **type-first approach** with Zod v4 for validation and Mongoose for database operations. The type system ensures consistency between validation, database schemas, and TypeScript types.

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Zod Schemas   │───▶│  TypeScript     │───▶│  Mongoose       │
│   (Validation)  │    │  Types          │    │  Schemas        │
│                 │    │                 │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Files

- **`src/lib/schemas/user.ts`** - Zod schemas and TypeScript types for user data
- **`src/server/db/user/model.ts`** - Mongoose schema that mirrors the Zod schema
- **`src/server/db/user/mutations.ts`** - Database operations with type safety

### Schema Definition Pattern

1. **Define Zod Schema** (Single source of truth):

```typescript
// src/lib/schemas/user.ts
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

// Generate TypeScript types
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type User = z.infer<typeof UserSchema>;
```

2. **Create Mongoose Schema** (Manual mapping for reliability):

```typescript
// src/server/db/user/model.ts
const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true, index: true },
  preferences: {
    openEnded: {
      question: { type: String, required: true },
      answer: { type: String, required: false },
    },
    causes: [{ type: String }],
    helpMethod: [{ type: String }],
    changeScope: { type: String },
    location: { type: String },
  },
  likedOrganizations: [{ type: String }],
}, {
  timestamps: true,
  collection: "users",
});
```

3. **Type-Safe Database Operations**:

```typescript
// src/server/db/user/mutations.ts
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences, // Zod-inferred type
): Promise<IUser> {
  // Type-safe database operation
  return await UserModel.findOneAndUpdate(
    { userId },
    { userId, preferences },
    { new: true, upsert: true, runValidators: true }
  ).exec();
}
```

### Type Safety Benefits

- **Validation**: Zod schemas validate data at runtime
- **Type Inference**: TypeScript types are automatically generated from Zod schemas
- **Database Consistency**: Mongoose schemas mirror Zod schemas
- **API Safety**: Server actions use validated types
- **Client Safety**: Components receive properly typed data

### Best Practices

1. **Single Source of Truth**: Always define schemas in Zod first
2. **Keep Schemas in Sync**: When updating Zod schemas, remember to update Mongoose schemas
3. **Use Inferred Types**: Prefer `z.infer<typeof Schema>` over manual type definitions
4. **Type Database Operations**: Use proper types for all database mutations and queries
5. **Avoid `any`**: Use `Record<string, unknown>` or specific types instead

### Schema Updates

When updating schemas:

1. Modify the Zod schema in `src/lib/schemas/user.ts`
2. Update the corresponding Mongoose schema in `src/server/db/user/model.ts`
3. Update any related database operations
4. Run type checking: `npx tsc --noEmit`

### Why Manual Mapping?

While libraries like `@palmetto/zod-mongoose-schema` exist, we use manual mapping because:

- **Reliability**: No external dependencies that might break with updates
- **Compatibility**: Works with Zod v4 and Mongoose 8.17.0
- **Control**: Full control over schema customization
- **Clarity**: Explicit and easy to understand
