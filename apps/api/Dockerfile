FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable

FROM base AS build
WORKDIR /app
# Copy workspace configuration files (only what's needed for api)
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY turbo.json tsconfig.json ./
# Copy shared package (dependency of api)
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
# Copy only api package.json
COPY apps/api/package.json ./apps/api/
# Install build tools needed for native dependencies like bcryptjs
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
# Install dependencies for shared package first, then api
RUN pnpm install --filter=@quietdash/shared --frozen-lockfile && \
    pnpm install --filter=@quietdash/api --frozen-lockfile
# Build shared package first
RUN pnpm --filter=@quietdash/shared build
# Copy api source files only
COPY apps/api/ ./apps/api/
# Build api
RUN pnpm run build:api

FROM base AS prod
WORKDIR /app
# Install build tools needed for native dependencies like bcryptjs
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
# Copy workspace files for proper dependency resolution
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
# Install production dependencies for api only
RUN pnpm install --filter=@quietdash/api --frozen-lockfile --prod

COPY --from=build /app/apps/api/dist ./dist

# Set NODE_PATH to help Node.js find modules in PNPM structure
ENV NODE_PATH=/app/node_modules/.pnpm/node_modules:/app/apps/api/node_modules

EXPOSE 3000
CMD [ "node", "dist/main" ] 