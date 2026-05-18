FROM node:24.15.0-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the scraper package and shared config
COPY apps/scraper/package.json apps/scraper/
COPY packages/eslint-config/ packages/eslint-config/
COPY packages/typescript-config/ packages/typescript-config/

# Install dependencies (production only for the scraper)
RUN pnpm install --filter @cause/scraper... --frozen-lockfile

# Copy scraper source
COPY apps/scraper/ apps/scraper/

# Build
RUN pnpm --filter @cause/scraper run build

# --- Production stage ---
FROM node:24.15.0-slim AS production

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app
LABEL org.opencontainers.image.source="https://github.com/jkracz/cause-compass"
LABEL org.opencontainers.image.title="cause-scraper-html"
LABEL org.opencontainers.image.description="Cause Compass HTML scraper"

COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/apps/scraper/package.json apps/scraper/
COPY --from=base /app/packages/eslint-config/ packages/eslint-config/
COPY --from=base /app/packages/typescript-config/ packages/typescript-config/

RUN pnpm install --filter @cause/scraper... --frozen-lockfile --prod

COPY --from=base /app/apps/scraper/dist/ apps/scraper/dist/

WORKDIR /app/apps/scraper

# Default: html-worker. Override via docker-compose command.
CMD ["node", "dist/html-worker.js"]
