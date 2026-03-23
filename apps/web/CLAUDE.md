# Web App

Next.js 16 with App Router, Convex backend, Tailwind CSS 4, and shadcn/ui components.

## Commands

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build
pnpm check-types  # Type check
```

## Convex Integration

- **Client-side root**: `src/app/ConvexClientProvider.tsx` passes the server-read `guestId` into `src/components/app-session-provider.tsx`
- **Auth/session**: `src/components/app-session-provider.tsx` owns the Shoo session, `ConvexProviderWithAuth`, and guest-to-account linking
- **Mutations/queries**: actor-specific writes and reads use direct `useMutation`/`useQuery` hooks from client components
- **Schema**: `packages/backend/convex/schema.ts`

## User Management

- Anonymous users get a `guestId` cookie from `src/proxy.ts`
- Authenticated users are identified in Convex via Shoo JWT claims
- User data lives in the Convex `users` table and can be linked from guest to authenticated state

## Routes

| Path          | Description                   |
| ------------- | ----------------------------- |
| `/`           | Landing page                  |
| `/onboarding` | User preference collection    |
| `/discover`   | Browse organizations          |
| `/my-causes`  | Liked organizations dashboard |
| `/org/[id]`   | Organization detail           |
