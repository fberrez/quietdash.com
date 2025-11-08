# Vitrine.io - E-Ink Display Dashboard

A full-stack TypeScript monorepo application for generating and managing dashboard images for Waveshare 7.5" e-ink displays (800×480 pixels).

## Architecture

This is a Turborepo monorepo with the following structure:

```
vitrine.io/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # Vite + React frontend
├── packages/
│   ├── shared/       # Shared TypeScript types and constants
│   └── api-client/   # Auto-generated API client from OpenAPI spec
```

## Features

### Backend (NestJS)
- **Authentication**: Multi-user JWT-based authentication
- **API Key Management**: Encrypted storage (AES-256-GCM) for external service API keys
- **Widget Configuration**: CRUD operations for dashboard widget settings
- **Image Generation**: node-canvas based PNG generation (800×480, B&W) for e-ink displays
- **OpenAPI/Swagger**: Auto-generated API documentation at `/api/docs`
- **Database**: PostgreSQL with Prisma ORM

### Frontend (Vite + React)
- **Modern Stack**: Vite, React, TypeScript, TailwindCSS, shadcn/ui
- **Routing**: React Router for navigation
- **Type-Safe API**: Auto-generated client from backend OpenAPI spec
- **Responsive Design**: Clean, modern UI with shadcn/ui components

### Supported Widgets
- **Weather**: OpenWeatherMap integration
- **Calendar**: Google Calendar integration
- **Time/Date**: Local time and date display
- **News/RSS**: RSS feed reader

## Getting Started

### Prerequisites
- Node.js ≥ 20.0.0
- pnpm ≥ 10.0.0
- Docker (for PostgreSQL)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd vitrine.io
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

For the API (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `ENCRYPTION_KEY`: **Must be exactly 32 characters** for AES-256 encryption
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

4. **Start PostgreSQL**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

6. **Build the shared package**
```bash
pnpm --filter @vitrine/shared build
```

7. **Start development servers**
```bash
# Terminal 1 - Backend API
pnpm --filter @vitrine/api dev

# Terminal 2 - Frontend
pnpm --filter @vitrine/web dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## Project Structure

### Backend (`apps/api`)
```
src/
├── auth/              # JWT authentication
├── api-keys/          # Encrypted API key management
├── widgets/           # Widget configuration
├── display/           # Image generation service
├── prisma/            # Database service
└── common/            # Shared utilities (encryption)
```

### Frontend (`apps/web`)
```
src/
├── components/        # React components
├── contexts/          # React contexts (Auth, etc.)
├── pages/            # Page components
│   ├── auth/         # Login/Register pages
│   ├── dashboard/    # Main dashboard
│   ├── api-keys/     # API key management
│   ├── widgets/      # Widget configuration
│   └── display/      # Display preview
└── lib/              # Utilities
```

### Shared Package (`packages/shared`)
```
src/
├── constants.ts      # Display dimensions, widget types, etc.
└── types/           # Shared TypeScript interfaces
    ├── user.types.ts
    ├── api-key.types.ts
    ├── widget.types.ts
    └── display.types.ts
```

## API Documentation

Once the backend is running, visit http://localhost:3000/api/docs to explore the interactive Swagger documentation.

### Key Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

**API Keys** (Protected)
- `GET /api-keys` - List all API keys
- `POST /api-keys` - Create new API key
- `PUT /api-keys/:id` - Update API key
- `DELETE /api-keys/:id` - Delete API key

**Widgets** (Protected)
- `GET /widgets` - List widget configurations
- `POST /widgets` - Create widget config
- `PUT /widgets/:id` - Update widget config
- `DELETE /widgets/:id` - Delete widget config

**Display** (Protected)
- `GET /display/image` - Generate 800×480 PNG for e-ink display
- `GET /display/preview` - Preview generated image

## Development Workflow

### Regenerating API Client

After making changes to the backend API:

```bash
# 1. Build the API to generate OpenAPI spec
pnpm --filter @vitrine/api build

# 2. Generate OpenAPI JSON
cd apps/api
pnpm generate:openapi

# 3. Generate TypeScript client
cd ../../packages/api-client
pnpm generate:client
```

Or use the convenience script:
```bash
pnpm generate:api-client
```

### Database Migrations

```bash
cd apps/api

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio to view data
npx prisma studio
```

## Building for Production

```bash
# Build all packages and apps
pnpm build

# Start production API
cd apps/api
pnpm start:prod

# Serve production frontend
cd apps/web
pnpm preview
```

## Security Notes

1. **Encryption Key**: The `ENCRYPTION_KEY` must be exactly 32 characters for AES-256-GCM encryption
2. **JWT Secret**: Use a strong, random secret for `JWT_SECRET` in production
3. **Database**: Use strong credentials for PostgreSQL in production
4. **CORS**: Update `FRONTEND_URL` to match your production frontend domain

## Technology Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS, Prisma, PostgreSQL, node-canvas
- **Frontend**: Vite, React, TypeScript, TailwindCSS, shadcn/ui
- **API**: OpenAPI/Swagger, openapi-typescript-codegen
- **Authentication**: JWT with bcrypt
- **Encryption**: AES-256-GCM

## License

[Your License Here]
