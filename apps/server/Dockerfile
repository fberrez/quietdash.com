# QuietDash server image (D3 separate-server, or the all-in-one Pi).
# Multi-stage: the build stage installs the full workspace (native better-sqlite3
# compiles here) and builds the studio bundle; the runtime stage carries the repo
# forward and runs the server as TS source via tsx (no server build step — D8).
#
# Build from the repo root:  docker compose build   (context: ., dockerfile: this)

# ---- build -----------------------------------------------------------------
FROM node:22-slim AS build

# Toolchain for better-sqlite3's native build (onlyBuiltDependencies in package.json).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

# Whole workspace: pnpm needs every package manifest to resolve workspace:* links,
# and the studio build pulls in shared/render sources.
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @quietdash/studio build

# ---- runtime ---------------------------------------------------------------
FROM node:22-slim AS runtime

RUN corepack enable
WORKDIR /app

# Carry the installed workspace (incl. compiled better-sqlite3 and studio/dist).
# Same base image as build → native ABI matches.
COPY --from=build /app /app

ENV NODE_ENV=production
ENV QUIETDASH_PORT=3000
ENV QUIETDASH_DATA_DIR=/data
EXPOSE 3000
VOLUME ["/data"]

# `start` is `tsx src/index.ts`; --filter sets cwd to apps/server, so the server's
# relative studio-dist path (../studio/dist) and migrations resolve correctly.
# runMigrations() + ensureInstance() run on boot.
CMD ["pnpm", "--filter", "@quietdash/server", "start"]
