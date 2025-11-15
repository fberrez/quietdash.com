# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuietDash.com is a monorepo-based e-ink display dashboard system that generates and displays customizable widget-based dashboards on Waveshare 7.5" e-Paper displays (800×480, B&W). The system consists of a NestJS backend API, React frontend web app, shared TypeScript packages, and a Python client for Raspberry Pi hardware integration.

## Technology Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Backend:** NestJS 10.4, Prisma 6, PostgreSQL, JWT auth, node-canvas for image generation
- **Frontend:** Vite 6, React 18, TailwindCSS, shadcn/ui, React Router 7
- **Shared:** TypeScript 5.7, Zod schemas, auto-generated OpenAPI client
- **Hardware:** Python 3, Waveshare e-Paper library, systemd service

## Package Manager

**IMPORTANT:** Always use `pnpm` as the package manager in this repository.

## Development Commands

### Starting Development
```bash
# Start PostgreSQL (required first)
docker-compose up -d

# Start all services (API + Web)
pnpm dev

# Or start individually:
pnpm --filter @quietdash/api dev        # Backend on :3000
pnpm --filter @quietdash/web dev        # Frontend on :5173
```

### Database Operations
```bash
# From apps/api directory:
cd apps/api
npx prisma migrate dev         # Create and apply migration
npx prisma studio              # Open database GUI
npx prisma generate            # Regenerate Prisma Client (after schema changes)
```

### API Client Generation
When backend API changes are made:
```bash
pnpm generate:api-client       # Rebuild + generate OpenAPI spec + regenerate TypeScript client
```

This runs:
1. `pnpm --filter @quietdash/api build` - Compile backend
2. `pnpm --filter @quietdash/api generate:openapi` - Generate OpenAPI JSON
3. `pnpm --filter @quietdash/api-client generate:client` - Generate TypeScript client

### Building
```bash
pnpm build                     # Build all packages and apps (turbo)
pnpm --filter @quietdash/api build      # Build backend only
pnpm --filter @quietdash/web build      # Build frontend only
```

### Code Quality
```bash
pnpm lint                      # Lint all code
pnpm type-check                # TypeScript validation
```

### Raspberry Pi Client
```bash
# From raspberry-pi directory:
./install.sh                           # Automated setup (run on Pi)
python3 quietdash_display.py             # Run manually for testing
sudo systemctl status vitrine-display.service  # Check service status
sudo journalctl -u vitrine-display.service -f  # View logs
```

## Architecture

### Monorepo Structure
```
quietdash.com/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Vite + React frontend
├── packages/
│   ├── shared/       # Types, constants, Zod schemas
│   └── api-client/   # Auto-generated OpenAPI client
└── raspberry-pi/     # Python e-ink display client
```

### Backend Architecture (`apps/api/src/`)

**Module Organization (NestJS):**
- `auth/` - Registration, login, JWT strategy, guards, decorators
- `api-keys/` - Encrypted storage for external API keys (OpenWeatherMap, Google Calendar)
- `widgets/` - Widget configuration CRUD (weather, calendar, time/date, news)
- `display/` - Image generation (800×480 B&W PNG using node-canvas)
- `prisma/` - Global database service wrapper
- `common/` - Encryption service (AES-256-GCM)

**Key Patterns:**
- All protected routes use `@UseGuards(JwtAuthGuard)`
- Current user extracted via `@CurrentUser()` decorator
- DTOs validated with class-validator
- Swagger/OpenAPI docs auto-generated at `/api/docs`

**Database Models (Prisma):**
- `User` - Authentication (email unique, bcrypt passwords)
- `ApiKey` - Encrypted external API keys (unique per user+provider)
- `WidgetConfig` - Widget settings with JSON position/settings (unique per user+type)
- `DisplaySettings` - Display configuration (refresh, brightness, orientation)

**Image Generation:**
- Display constant: 800×480 pixels (Waveshare 7.5")
- Format: 1-bit B&W PNG
- Library: node-canvas (server-side HTML5 Canvas API)
- Endpoints: `GET /display/image` (for Pi), `GET /display/preview` (for browser)

### Frontend Architecture (`apps/web/src/`)

**Routing:**
- Public: `/login`, `/register`
- Protected: `/dashboard`, `/api-keys`, `/widgets`, `/display`
- Auth managed via Context API (`contexts/AuthContext`)

**API Integration:**
- Uses auto-generated `@quietdash/api-client` package
- Type-safe API calls with full TypeScript support
- Vite proxy: `/api/*` → `http://localhost:3000/*`

**UI Stack:**
- TailwindCSS + shadcn/ui components
- Lucide React icons
- React Router for SPA navigation

### Shared Package (`packages/shared/`)

**Constants:**
- `DISPLAY` - Width (800), Height (480), Color Mode (BW)
- `WIDGET_TYPES` - weather, calendar, time_date, news_rss
- `SERVICE_PROVIDERS` - openweathermap, google_calendar

**Types:** Complete TypeScript definitions for User, ApiKey, Widget, Display entities

**Schemas:** Zod validation schemas for widget operations

### Raspberry Pi Client (`raspberry-pi/`)

**Key Features:**
- JWT authentication with token refresh
- Fetches images from `GET /display/image` endpoint
- Converts API images to 1-bit B&W for e-Paper
- Fallback to local dashboard drawing if API unavailable
- Displays shutdown message on exit: "vitrine is closed, come back later..."
- Systemd service for auto-start on boot

**Configuration:** Uses `.env` file with `VITRINE_API_URL`, `VITRINE_EMAIL`, `VITRINE_PASSWORD`, `VITRINE_REFRESH_INTERVAL`

## Environment Setup

### Backend (`apps/api/.env`)
Required variables:
```bash
DATABASE_URL="postgresql://vitrine:quietdash_password@localhost:5432/quietdash_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
ENCRYPTION_KEY="exactly32characterslongstring!!"  # MUST be 32 chars
PORT="3000"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (No .env needed)
Vite proxy handles API routing during development.

### Raspberry Pi (`raspberry-pi/.env`)
```bash
VITRINE_API_URL="http://192.168.1.100:3000"  # Your API server IP
VITRINE_EMAIL="test1@example.com"
VITRINE_PASSWORD="password123"
VITRINE_REFRESH_INTERVAL="300"  # seconds
```

## Common Workflows

### Adding a New API Endpoint
1. Create/modify controller and service in `apps/api/src/`
2. Add DTOs with validation decorators
3. Update Swagger decorators (`@ApiTags`, `@ApiResponse`, etc.)
4. Run `pnpm generate:api-client` to regenerate TypeScript client
5. Use updated client in `apps/web/`

### Adding a New Database Model
1. Update `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name` from `apps/api/`
3. Prisma Client auto-regenerates
4. Create corresponding types in `packages/shared/src/types/`
5. Export from `packages/shared/src/index.ts`

### Adding a New Widget Type
1. Add type to `WIDGET_TYPES` in `packages/shared/src/constants.ts`
2. Create type definition in `packages/shared/src/types/widget.types.ts`
3. Implement rendering logic in `apps/api/src/display/display.service.ts`
4. Add UI configuration in `apps/web/src/pages/WidgetsPage.tsx`

### Modifying Display Image Generation
1. Update `apps/api/src/display/display.service.ts`
2. Follow node-canvas API (HTML5 Canvas API)
3. Ensure output is 800×480 pixels, 1-bit B&W PNG
4. Test with `GET /display/preview` in browser
5. Test on Raspberry Pi with `python3 quietdash_display.py`

## Security Considerations

- **API Keys:** Encrypted with AES-256-GCM before database storage (encryption key must be exactly 32 characters)
- **Passwords:** Hashed with bcrypt before storage
- **JWT Tokens:** Configurable expiration, validate on all protected routes
- **CORS:** Configured for specific origins (default: localhost:5173)
- **Input Validation:** class-validator on all DTOs, Zod schemas for widget configs
- **Cascade Deletes:** User deletion removes all associated data (API keys, widgets, settings)

## Network Access

The API binds to `0.0.0.0` to allow Raspberry Pi clients on the local network to connect. Ensure firewall rules allow port 3000 if needed. The API startup logs display the local network IP for easy Raspberry Pi configuration.

## Display Specifications

- **Resolution:** 800×480 pixels (Waveshare 7.5" V2)
- **Color Mode:** 1-bit black & white
- **Format:** PNG
- **Orientation:** Horizontal/landscape
- **Widget Layout:** Configurable x/y position and width/height within 800×480 bounds

## Testing Credentials

Default test user (configured in Raspberry Pi client):
- Email: `test1@example.com`
- Password: `password123`

Create via `POST /auth/register` or use existing account.

## Path Aliases

- `@quietdash/shared` - Shared types, constants, schemas
- `@quietdash/api-client` - Auto-generated API client
- `@/` - Frontend src directory (web app only)

## Build Pipeline

Turborepo orchestrates builds with dependency awareness:
1. `packages/shared` builds first (types needed by all)
2. `apps/api` builds next (generates OpenAPI spec)
3. `packages/api-client` generates from OpenAPI
4. `apps/web` builds last (uses api-client)

Turbo caches build outputs for faster subsequent builds.

## Debugging

- **Backend logs:** Console output from `pnpm --filter @quietdash/api dev`
- **Frontend logs:** Browser console
- **Database inspection:** `npx prisma studio` from `apps/api/`
- **API documentation:** `http://localhost:3000/api/docs` (Swagger UI)
- **Raspberry Pi logs:** `sudo journalctl -u vitrine-display.service -f`
