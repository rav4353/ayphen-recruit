# Ayphen TalentX

<p align="center">
  <img src="docs/assets/logo.png" alt="TalentX Logo" width="200">
</p>

<p align="center">
  <strong>AI-first Applicant Tracking System</strong><br>
  Modern, enterprise-grade ATS designed to streamline the entire hiring lifecycle
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🚀 Features

### Core ATS Features
- **Job Management** - Create, approve, and publish job requisitions with AI-powered JD generation
- **Candidate Management** - Central database with resume parsing, duplicate detection, and GDPR compliance
- **Application Tracking** - Kanban board, bulk actions, and customizable pipelines
- **Interview Scheduling** - Google/Outlook calendar sync, self-scheduling links, panel coordination
- **Offer Management** - Offer letter builder, approval workflows, e-signature integration (DocuSign)
- **Onboarding** - Pre-boarding checklists, document collection, HRIS sync

### AI-Powered Intelligence
- **AI JD Writer** - Generate job descriptions with GPT-4
- **Resume Parsing** - Extract structured data from PDF/DOCX resumes
- **Candidate Matching** - Semantic search with vector embeddings
- **Interview Feedback Summarization** - AI-generated summaries of interviewer feedback

### Enterprise Features
- **Multi-tenancy** - Full tenant isolation with custom branding
- **Role-Based Access Control** - Granular permissions system
- **SSO/SAML** - Enterprise single sign-on support
- **Audit Logs** - Complete activity tracking for compliance
- **Career Site Builder** - Custom branded career pages with domain support

### Integrations
- **Job Boards** - LinkedIn, Indeed, ZipRecruiter, Glassdoor, Monster
- **HRIS** - Workday, BambooHR, ADP, SAP SuccessFactors
- **Calendar** - Google Calendar, Outlook/Microsoft 365
- **Communication** - Slack, Microsoft Teams, Email, SMS
- **Background Checks** - Checkr, HireRight
- **E-Signature** - DocuSign, Adobe Sign

---

## 📋 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **PostgreSQL** >= 14
- **Redis** >= 6 (optional, for caching/queues)

### Installation

```bash
# Clone the repository
git clone https://github.com/ayphen/talentx.git
cd talentx

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed

# Start development servers
cd ../..
pnpm dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/talentx"

# API
API_PORT=3001
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Frontend
WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"

# AI (Optional)
OPENAI_API_KEY="sk-..."

# Storage (Optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION="us-east-1"

# Email (Optional)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
```

### Running the Application

```bash
# Development (all apps)
pnpm dev

# Development (API only)
pnpm --filter api dev

# Development (Web only)
pnpm --filter web dev

# Production build
pnpm build

# Run tests
pnpm test
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Main application |
| API | http://localhost:3001 | REST API |
| API Docs | http://localhost:3001/api/v1/docs | Swagger documentation |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System architecture and design decisions |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Production deployment instructions |
| [API Reference](./docs/API.md) | API documentation |
| [Contributing](./CONTRIBUTING.md) | Contribution guidelines |
| [Module Docs](./docs/) | Detailed module specifications |

### Module Documentation

- [Authentication & Identity](./docs/00_Authentication_Identity.md)
- [Job Management](./docs/01_Job_Management.md)
- [Candidate Management](./docs/02_Candidate_Application_Management.md)
- [Sourcing & Referrals](./docs/03_Sourcing_Referrals.md)
- [Pipeline & Workflow](./docs/04_Pipeline_Workflow_Management.md)
- [Interview Scheduling](./docs/05_Interview_Scheduling.md)
- [Interview Feedback](./docs/06_Interview_Feedback_Scorecards.md)
- [Communication](./docs/07_Communication_Module.md)
- [Offer Management](./docs/08_Offer_Management.md)
- [Onboarding](./docs/09_Onboarding.md)
- [Admin & Compliance](./docs/10_Admin_Governance_Compliance.md)
- [AI Layer](./docs/11_AI_Layer.md)
- [Integrations](./docs/12_Integrations.md)
- [Reporting & Analytics](./docs/13_Reporting_Analytics.md)

---

## 🏗️ Architecture

```
talentx/
├── apps/
│   ├── api/                 # NestJS Backend API
│   │   ├── src/
│   │   │   ├── common/      # Shared utilities, guards, filters
│   │   │   ├── modules/     # Feature modules
│   │   │   └── prisma/      # Database client & migrations
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/                 # React Frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Page components
│       │   ├── lib/         # Utilities & API client
│       │   └── hooks/       # Custom React hooks
│       └── public/
├── packages/                # Shared packages (if any)
├── docs/                    # Documentation
└── docker/                  # Docker configurations
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, TanStack Query |
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 14+ |
| **Cache** | Redis |
| **AI** | OpenAI GPT-4, pgvector |
| **Storage** | AWS S3 |
| **Auth** | JWT, SAML/SSO |

See [Architecture Documentation](./docs/ARCHITECTURE.md) for detailed diagrams.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests
pnpm --filter api test

# Run with coverage
pnpm --filter api test:cov

# Run e2e tests
pnpm --filter api test:e2e
```

---

## 🚢 Deployment

### Docker

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Proprietary - © 2024 Ayphen Technologies. All rights reserved.

---

## 🙏 Support

- 📧 Email: support@ayphen.com
- 📖 Documentation: https://docs.ayphen.com
- 🐛 Issues: https://github.com/ayphen/talentx/issues
