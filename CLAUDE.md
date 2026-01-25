# CLAUDE.md

Cause Compass: Platform helping users discover nonprofit organizations matching their values.

## Monorepo (pnpm + Turborepo)

- `apps/web` - Next.js 16 frontend
- `apps/parsley` - Data processing pipeline
- `packages/backend` - Convex backend
- `packages/types` - Shared Zod schemas

## Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Run all apps
pnpm build         # Build all
pnpm lint          # Lint all
pnpm check-types   # Type check all
```

## Documentation

- [Convex Guidelines](docs/convex.md) - Function patterns, indexing rules
- [Architecture](docs/architecture.md) - Data flow, system design
- [apps/web/CLAUDE.md](apps/web/CLAUDE.md) - Frontend patterns
- [apps/parsley/CLAUDE.md](apps/parsley/CLAUDE.md) - Data pipeline scripts
- [packages/backend/convex/README.md](packages/backend/convex/README.md) - Batch processing workflow
