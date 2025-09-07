# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code quality checks

## Tech Stack & Architecture

**Framework**: Next.js 15 with App Router and TypeScript  
**Database**: MongoDB with Mongoose ODM  
**UI**: Tailwind CSS with Radix UI components  
**Validation**: Zod schemas for type-safe data validation  
**State**: React hooks with client/server boundary management using `client-only` and `server-only`

## Database Architecture

The application uses MongoDB with two main collections:

**Users** (`src/server/db/user/`):
- Schema: `userId`, `preferences` (causes, helpMethod, changeScope, location), `likedOrganizations`
- Automatic user creation via middleware using nanoid-generated cookies

**Organizations** (`src/server/db/organization/`):
- Tax-exempt organizations with comprehensive IRS data
- Fields include EIN, financial data, NTEE codes, search results, social media URLs
- Complex schema in `src/lib/schemas/organization.ts` with multiple code validation schemas

## Key Patterns

**Path Aliases**: Use `@/` for src root, `@components/`, `@lib/`, `@hooks/`, `@ui/` for organized imports

**Server/Client Boundaries**: 
- Database operations in `src/server/db/` with queries/mutations pattern
- Actions in `src/lib/actions/` for server-side operations
- UI components clearly separated with `"use client"` directive when needed

**User Management**: 
- Automatic user ID assignment via middleware (`src/middleware.ts`)
- Cookie-based user tracking for preferences and organization likes
- Database user creation on first interaction

**Validation**: Comprehensive Zod schemas in `src/lib/schemas/` for all data structures including organization codes, search results, and user preferences

## Environment Requirements

- `MONGODB_URI` or `DATABASE_URL` - MongoDB connection string
- Development uses connection caching to prevent multiple connections during hot reload