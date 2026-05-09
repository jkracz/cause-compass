# Web App

This package is the Next.js 16 frontend using the App Router, Convex, Tailwind CSS 4, and shadcn/ui components.

## Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
```

## Convex Integration

- `src/app/ConvexClientProvider.tsx` passes the server-read `guestId` into `src/components/app-session-provider.tsx`
- `src/components/app-session-provider.tsx` owns the Better Auth session, `ConvexBetterAuthProvider`, and guest-to-account linking
- Client-side reads and writes use direct `useQuery` and `useMutation` hooks from client components
- Shared backend schema lives in `packages/backend/convex/schema.ts`

If a change touches Convex behavior or schema assumptions, read [packages/backend/AGENTS.md](../../packages/backend/AGENTS.md) too.

## User Management

- Anonymous users receive a `guestId` cookie from `src/proxy.ts`
- Authenticated users are identified in Convex through Better Auth JWT claims
- User records live in the Convex `users` table and can be linked from guest to authenticated state

## Routes

- `/` - landing page
- `/onboarding` - user preference collection
- `/discover` - organization discovery
- `/my-causes` - liked organizations dashboard
- `/org/[id]` - organization detail page
