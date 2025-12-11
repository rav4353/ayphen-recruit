# Ayphen TalentX - Setup Guide

## Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 8.x (`npm install -g pnpm`)
- **Docker** and **Docker Compose**
- **Python** >= 3.11 (for AI service)

## Quick Start

### 1. Clone and Install

```bash
# Navigate to project
cd "ayphen recruit"

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values (especially for production)
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Optional: Start with admin tools (pgAdmin, Redis Commander)
docker-compose --profile tools up -d
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (creates tables)
pnpm db:migrate

# Or push schema directly (for development)
pnpm db:push

# Optional: Open Prisma Studio to view data
pnpm db:studio
```

### 5. Start Development Servers

```bash
# Start all services (API + Web)
pnpm dev

# Or start individually:
pnpm dev:api   # Backend on http://localhost:3001
pnpm dev:web   # Frontend on http://localhost:3000
```

### 6. Start AI Service (Optional)

```bash
cd apps/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Run service
python main.py  # Runs on http://localhost:8000
```

## Access Points

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| AI Service | http://localhost:8000 |
| pgAdmin | http://localhost:5050 (admin@talentx.com / admin) |
| Redis Commander | http://localhost:8081 |

## Project Structure

```
ayphen recruit/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── prisma/          # Database schema
│   │   └── src/
│   │       ├── modules/     # Feature modules
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── jobs/
│   │       │   ├── candidates/
│   │       │   ├── applications/
│   │       │   └── pipelines/
│   │       └── prisma/      # Prisma service
│   ├── web/                 # React Frontend
│   │   └── src/
│   │       ├── layouts/
│   │       ├── pages/
│   │       ├── stores/
│   │       └── lib/
│   └── ai-service/          # Python AI Service
├── docs/                    # Module specifications (*.md)
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Common Commands

```bash
# Development
pnpm dev              # Start all dev servers
pnpm lint             # Lint all packages
pnpm build            # Build all packages

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (dev only)
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:up        # Start containers
pnpm docker:down      # Stop containers
```

## Next Steps

1. **Create a tenant and admin user** via API or Prisma Studio
2. **Configure OAuth** (Google, LinkedIn) in `.env` for social login
3. **Set up OpenAI API key** for AI features
4. **Configure SMTP** for email notifications

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port
lsof -i :3001
kill -9 <PID>
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker ps

# View logs
docker logs talentx-postgres
```

### Prisma issues
```bash
# Reset database (WARNING: deletes all data)
pnpm --filter @talentx/api exec prisma migrate reset
```
