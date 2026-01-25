# Web App

Next.js 16 with App Router, Convex backend, Tailwind CSS 4 + Radix UI.

## Commands

```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build
pnpm check-types  # Type check
```

## Convex Integration

- **Client-side**: `ConvexReactClient` in `src/app/ConvexClientProvider.tsx`
- **Server actions**: `fetchMutation` from `convex/nextjs` in `src/lib/actions/`
- **Schema**: `packages/backend/convex/schema.ts`

## User Management

- Automatic user ID assignment via proxy middleware (`src/proxy.ts`)
- Cookie-based tracking using nanoid-generated IDs
- User data stored in Convex `users` table

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/onboarding` | User preference collection |
| `/discover` | Browse organizations |
| `/my-causes` | Liked organizations dashboard |
| `/org/[id]` | Organization detail |
