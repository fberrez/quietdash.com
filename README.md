# QuietDash.com - E-Ink Display Dashboard

A full-stack TypeScript monorepo application for generating and managing dashboard images for Waveshare 7.5" e-ink displays (800×480 pixels).

## Architecture

This is a Turborepo monorepo with the following structure:

```
quietdash.com/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # Vite + React frontend (dashboard management)
│   └── marketing/    # Vite + React marketing website
├── packages/
│   ├── shared/       # Shared TypeScript types and constants
│   └── api-client/   # Auto-generated API client from OpenAPI spec
└── raspberry-pi/     # Python scripts for Raspberry Pi e-ink display
```

## Features

### Backend (NestJS)
- **Authentication**: Multi-user JWT-based authentication
- **API Key Management**: Encrypted storage (AES-256-GCM) for external service API keys
- **Widget Configuration**: CRUD operations for dashboard widget settings
- **Image Generation**: node-canvas based PNG generation (800×480, B&W) for e-ink displays
- **Waitlist System**: Email verification and referral program with Resend integration
- **OpenAPI/Swagger**: Auto-generated API documentation at `/api/docs`
- **Database**: PostgreSQL with Prisma ORM

### Frontend Applications

#### Web App (`apps/web`)
- **Modern Stack**: Vite, React, TypeScript, TailwindCSS, shadcn/ui
- **Routing**: React Router for navigation
- **Type-Safe API**: Auto-generated client from backend OpenAPI spec
- **Responsive Design**: Clean, modern UI with shadcn/ui components
- **Features**: User authentication, API key management, dashboard configuration

#### Marketing Site (`apps/marketing`)
- **Landing Page**: Modern marketing website showcasing features
- **Waitlist Integration**: Sign-up form with referral system
- **Dashboard Showcase**: Interactive previews of available dashboards
- **Responsive Design**: Optimized for all devices

### Supported Dashboards

The platform supports various dashboard types optimized for e-ink displays:

- **Productivity Dashboard**: Pomodoro timer, daily goals, unread messages, deep work tracking, priority todos
- **Health Dashboard**: Steps counter, water intake, sleep tracker, workout streak, calorie tracker, mood tracker
- **Morning Routine**: Current time, weather forecast, calendar events, daily quote
- **GitHub Stats**: Pull requests, issues, contribution graph, recent activity
- **Portfolio Tracker**: Portfolio value, daily P&L, holdings allocation, sector breakdown
- **Train Schedule**: Upcoming SNCF train departures with times, platforms, and status
- **Projects Monitor**: Project status, uptime, deployments, revenue metrics
- **Word Count**: Writing progress with total count and 7-day chart visualization

All dashboards are fully customizable with configurable widgets.

## Getting Started

### Prerequisites
- Node.js ≥ 20.0.0
- pnpm ≥ 10.0.0
- Docker (for PostgreSQL)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd quietdash.com
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
- `RESEND_API_KEY`: Resend API key for sending waitlist verification emails (optional, but required for waitlist functionality)
- `RESEND_AUDIENCE_ID`: Resend audience ID for adding verified users to mailing list (optional)

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
pnpm --filter @quietdash/shared build
```

7. **Start development servers**
```bash
# Terminal 1 - Backend API
pnpm --filter @quietdash/api dev

# Terminal 2 - Web App (Dashboard Management)
pnpm --filter @quietdash/web dev

# Terminal 3 - Marketing Site (Optional)
pnpm --filter @quietdash/marketing dev
```

The application will be available at:
- **Web App**: http://localhost:5173 (or next available port)
- **Marketing Site**: http://localhost:5174 (or next available port)
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## Project Structure

### Backend (`apps/api`)
```
src/
├── auth/              # JWT authentication
├── api-keys/          # Encrypted API key management
├── waitlist/          # Waitlist with referral system
├── prisma/            # Database service
└── common/            # Shared utilities (encryption)
```

### Web App (`apps/web`)
```
src/
├── components/        # React components
│   ├── layout/       # Layout components
│   ├── ui/           # shadcn/ui components
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts (Auth, etc.)
├── pages/            # Page components
│   ├── auth/         # Login/Register pages
│   ├── api-keys/     # API key management
│   └── BackofficePage.tsx
└── lib/              # Utilities
```

### Marketing Site (`apps/marketing`)
```
src/
├── components/        # React components
│   ├── sections/     # Landing page sections
│   └── ui/           # UI components
├── pages/            # Page components
├── hooks/            # Custom React hooks
└── lib/              # Utilities (experiments, analytics)
```

### Raspberry Pi Client (`raspberry-pi/`)
```
raspberry-pi/
├── quietdash_display.py          # Main API-connected display client
├── health_dashboard_display.py   # Standalone health dashboard
├── productivity_dashboard_display.py  # Standalone productivity dashboard
├── morning_routine_display.py    # Standalone morning routine
├── github_stats_display.py       # GitHub statistics display
├── portfolio_display.py          # Portfolio tracker display
├── projects_monitor_display.py   # Projects monitoring display
├── train_schedule_display.py     # Train schedule display
├── wordcount_display.py          # Word count tracker
└── quietdash-display.service     # Systemd service file
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

**Waitlist** (Public)
- `POST /waitlist` - Join the waitlist (with optional referral code)
- `GET /waitlist/verify/:token` - Verify email address
- `GET /waitlist/stats` - Get waitlist statistics
- `GET /waitlist/referrals/:token` - Get referral statistics for a user

**Display** (Protected)
- `GET /display/image` - Generate 800×480 PNG for e-ink display
- `GET /display/preview` - Preview generated image

## Development Workflow

### Convenience Scripts

The root `package.json` includes convenient scripts for common tasks:

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:api        # Backend API only
pnpm dev:web        # Web app only
pnpm dev:marketing  # Marketing site only

# Build all apps
pnpm build

# Build specific apps
pnpm build:api
pnpm build:web
pnpm build:marketing

# Generate API client (convenience script)
pnpm generate:api-client
```

### Regenerating API Client

After making changes to the backend API:

```bash
# 1. Build the API to generate OpenAPI spec
pnpm --filter @quietdash/api build

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

# Serve production web app
cd apps/web
pnpm preview

# Serve production marketing site
cd apps/marketing
pnpm preview
```

## Raspberry Pi Integration

The project includes Python scripts for running dashboards on Raspberry Pi with Waveshare e-ink displays.

### Quick Start

1. **Install dependencies** (see `raspberry-pi/README.md` for full instructions):
```bash
cd raspberry-pi
pip3 install -r requirements.txt
```

2. **Configure API connection** (for `quietdash_display.py`):
```bash
# Create .env file with your API credentials
QUIETDASH_API_URL=http://your-server:3000
QUIETDASH_EMAIL=your-email@example.com
QUIETDASH_PASSWORD=your-password
QUIETDASH_REFRESH_INTERVAL=300
```

3. **Run standalone dashboard scripts**:
```bash
# Health dashboard
python3 health_dashboard_display.py

# Productivity dashboard
python3 productivity_dashboard_display.py

# Morning routine
python3 morning_routine_display.py
```

4. **Set up as systemd service** (for auto-start on boot):
```bash
sudo cp quietdash-display.service /etc/systemd/system/
sudo systemctl enable quietdash-display.service
sudo systemctl start quietdash-display.service
```

For detailed setup instructions, hardware requirements, and troubleshooting, see [`raspberry-pi/README.md`](raspberry-pi/README.md).

## Security Notes

1. **Encryption Key**: The `ENCRYPTION_KEY` must be exactly 32 characters for AES-256-GCM encryption
2. **JWT Secret**: Use a strong, random secret for `JWT_SECRET` in production
3. **Database**: Use strong credentials for PostgreSQL in production
4. **CORS**: Update `FRONTEND_URL` to match your production frontend domain

## Technology Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS, Prisma, PostgreSQL, node-canvas, Resend (email)
- **Frontend**: Vite, React, TypeScript, TailwindCSS, shadcn/ui, React Router
- **API**: OpenAPI/Swagger, openapi-typescript-codegen
- **Authentication**: JWT with bcrypt
- **Encryption**: AES-256-GCM
- **Raspberry Pi**: Python 3, Waveshare e-Paper library, PIL/Pillow

