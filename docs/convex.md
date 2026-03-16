# Convex Guidelines

When writing Convex functions:

- Always use the new function syntax with explicit `args` and `returns` validators
- Use `v.null()` for functions that return nothing
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Use `ctx.runQuery`/`ctx.runMutation` for calling other functions (not direct imports)
- Never use `filter()` in queries; use indexes with `withIndex()` instead
- Index names should include all fields: `by_field1_and_field2`

## Key Tables

`organizations`, `users`, `searchResults`, `crawlResults`, `aiConfirmations`, `batchJobs`

## Operational Docs

- Pipeline health query usage and field reference:
  - `/Users/joekracz/Documents/projects/cause-compass/cause-compass/docs/pipeline-health.md`
