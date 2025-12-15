# Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Security Architecture](#security-architecture)
- [Integration Architecture](#integration-architecture)

---

## System Overview

Ayphen TalentX is a modern, multi-tenant SaaS application built with a microservices-ready monolithic architecture. It follows clean architecture principles with clear separation of concerns.

### Key Principles

- **Multi-tenancy**: Complete data isolation per tenant
- **Scalability**: Horizontally scalable stateless services
- **Security**: Defense in depth with multiple security layers
- **Extensibility**: Plugin-based integration system
- **Performance**: Caching, pagination, and query optimization

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>React + TypeScript]
        MOBILE[Mobile App<br/>React Native]
        CAREER[Career Site<br/>Public Pages]
    end

    subgraph "Edge Layer"
        CDN[CDN<br/>CloudFront/Cloudflare]
        LB[Load Balancer<br/>Nginx/ALB]
    end

    subgraph "Application Layer"
        API[API Server<br/>NestJS]
        WORKER[Background Workers<br/>Bull Queue]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary DB)]
        REDIS[(Redis<br/>Cache/Queue)]
        S3[(S3<br/>File Storage)]
        VECTOR[(pgvector<br/>Embeddings)]
    end

    subgraph "External Services"
        OPENAI[OpenAI API]
        EMAIL[Email Service<br/>SendGrid]
        CAL[Calendar APIs<br/>Google/Outlook]
        BOARDS[Job Boards<br/>LinkedIn/Indeed]
    end

    WEB --> CDN
    MOBILE --> CDN
    CAREER --> CDN
    CDN --> LB
    LB --> API
    API --> PG
    API --> REDIS
    API --> S3
    API --> VECTOR
    API --> WORKER
    WORKER --> REDIS
    WORKER --> PG
    WORKER --> EMAIL
    API --> OPENAI
    API --> CAL
    API --> BOARDS
```

---

## Component Architecture

### Backend Module Structure

```mermaid
graph TB
    subgraph "API Gateway"
        MAIN[main.ts<br/>Entry Point]
        GUARDS[Auth Guards]
        FILTERS[Exception Filters]
        INTERCEPTORS[Response Interceptors]
    end

    subgraph "Core Modules"
        AUTH[Auth Module]
        USERS[Users Module]
        ROLES[Roles Module]
    end

    subgraph "Business Modules"
        JOBS[Jobs Module]
        CANDIDATES[Candidates Module]
        APPS[Applications Module]
        INTERVIEWS[Interviews Module]
        OFFERS[Offers Module]
        ONBOARD[Onboarding Module]
    end

    subgraph "Support Modules"
        AI[AI Module]
        COMM[Communication Module]
        ANALYTICS[Analytics Module]
        INTEGRATIONS[Integrations Module]
    end

    subgraph "Infrastructure"
        PRISMA[Prisma Module]
        STORAGE[Storage Module]
        SETTINGS[Settings Module]
    end

    MAIN --> GUARDS
    GUARDS --> AUTH
    AUTH --> USERS
    USERS --> ROLES
    
    JOBS --> PRISMA
    CANDIDATES --> PRISMA
    APPS --> PRISMA
    INTERVIEWS --> PRISMA
    OFFERS --> PRISMA
    
    CANDIDATES --> AI
    JOBS --> AI
    APPS --> COMM
    INTERVIEWS --> COMM
```

### Frontend Component Structure

```mermaid
graph TB
    subgraph "App Shell"
        LAYOUT[Layout Components]
        NAV[Navigation]
        AUTH_UI[Auth Provider]
    end

    subgraph "Feature Components"
        DASHBOARD[Dashboard]
        JOBS_UI[Jobs]
        CANDIDATES_UI[Candidates]
        PIPELINE[Pipeline/Kanban]
        INTERVIEWS_UI[Interviews]
        OFFERS_UI[Offers]
        REPORTS[Reports]
        SETTINGS_UI[Settings]
    end

    subgraph "Shared Components"
        UI[UI Components]
        FORMS[Form Components]
        TABLES[Table/List]
        MODALS[Modals/Dialogs]
    end

    subgraph "Data Layer"
        API_CLIENT[API Client<br/>Axios]
        QUERY[TanStack Query]
        STATE[Zustand Store]
    end

    LAYOUT --> NAV
    LAYOUT --> AUTH_UI
    
    DASHBOARD --> QUERY
    JOBS_UI --> QUERY
    CANDIDATES_UI --> QUERY
    PIPELINE --> QUERY
    
    QUERY --> API_CLIENT
    API_CLIENT --> STATE
```

---

## Data Flow

### Request/Response Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant LB as Load Balancer
    participant API as API Server
    participant G as Auth Guard
    participant S as Service
    participant DB as Database
    participant R as Redis Cache

    C->>LB: HTTP Request
    LB->>API: Forward Request
    API->>G: Validate JWT
    G-->>API: User Context
    API->>S: Business Logic
    S->>R: Check Cache
    alt Cache Hit
        R-->>S: Cached Data
    else Cache Miss
        S->>DB: Query
        DB-->>S: Result
        S->>R: Store in Cache
    end
    S-->>API: Response Data
    API-->>C: JSON Response
```

### Application Workflow

```mermaid
stateDiagram-v2
    [*] --> Applied: Candidate Applies
    Applied --> Screening: Auto-screen
    Screening --> Rejected: Failed Screening
    Screening --> Phone: Pass Screening
    Phone --> Interview: Schedule Interview
    Phone --> Rejected: Reject
    Interview --> TechnicalRound: Pass
    Interview --> Rejected: Reject
    TechnicalRound --> FinalRound: Pass
    TechnicalRound --> Rejected: Reject
    FinalRound --> OfferPending: Pass
    FinalRound --> Rejected: Reject
    OfferPending --> OfferExtended: Offer Approved
    OfferExtended --> Accepted: Candidate Accepts
    OfferExtended --> Declined: Candidate Declines
    Accepted --> Hired: Start Date
    Hired --> [*]
    Rejected --> [*]
    Declined --> [*]
```

---

## Database Schema

### Core Entity Relationships

```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ JOB : has
    TENANT ||--o{ CANDIDATE : has
    TENANT ||--o{ PIPELINE : has
    
    USER ||--o{ APPLICATION : reviews
    USER }|--|| ROLE : has
    
    JOB ||--o{ APPLICATION : receives
    JOB }|--|| PIPELINE : uses
    JOB }|--o| DEPARTMENT : belongs_to
    JOB }|--o| LOCATION : located_at
    
    CANDIDATE ||--o{ APPLICATION : submits
    CANDIDATE ||--o{ CANDIDATE_NOTE : has
    
    APPLICATION ||--o{ INTERVIEW : has
    APPLICATION ||--o{ OFFER : receives
    APPLICATION }|--|| PIPELINE_STAGE : current_stage
    
    INTERVIEW }|--|| USER : interviewer
    INTERVIEW ||--o{ INTERVIEW_FEEDBACK : has
    
    OFFER }|--|| OFFER_TEMPLATE : uses
    OFFER ||--o{ OFFER_APPROVAL : requires

    PIPELINE ||--o{ PIPELINE_STAGE : has
```

### Key Tables

| Table | Description |
|-------|-------------|
| `tenants` | Multi-tenant organizations |
| `users` | System users (recruiters, hiring managers) |
| `roles` | Custom role definitions |
| `jobs` | Job requisitions |
| `candidates` | Candidate profiles |
| `applications` | Job applications |
| `pipelines` | Hiring workflow templates |
| `pipeline_stages` | Stages within pipelines |
| `interviews` | Scheduled interviews |
| `interview_feedback` | Interviewer evaluations |
| `offers` | Job offers |
| `activity_logs` | Audit trail |

---

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant API as API Server
    participant AUTH as Auth Service
    participant DB as Database

    U->>C: Enter Credentials
    C->>API: POST /auth/login
    API->>AUTH: Validate Credentials
    AUTH->>DB: Check User
    DB-->>AUTH: User Data
    AUTH->>AUTH: Generate JWT
    AUTH-->>API: Access + Refresh Tokens
    API-->>C: Tokens
    C->>C: Store Tokens
    
    Note over C,API: Subsequent Requests
    C->>API: Request + Bearer Token
    API->>API: Validate JWT
    API->>API: Check Permissions
    API-->>C: Response
```

### Security Layers

```mermaid
graph TB
    subgraph "Network Security"
        WAF[WAF/DDoS Protection]
        SSL[TLS 1.3]
        CORS[CORS Policy]
    end

    subgraph "Application Security"
        AUTH_L[JWT Authentication]
        RBAC[Role-Based Access]
        TENANT[Tenant Isolation]
        RATE[Rate Limiting]
    end

    subgraph "Data Security"
        ENCRYPT[Encryption at Rest]
        HASH[Password Hashing<br/>bcrypt]
        MASK[Data Masking]
        AUDIT[Audit Logging]
    end

    WAF --> SSL
    SSL --> CORS
    CORS --> AUTH_L
    AUTH_L --> RBAC
    RBAC --> TENANT
    TENANT --> RATE
    RATE --> ENCRYPT
    ENCRYPT --> HASH
    HASH --> MASK
    MASK --> AUDIT
```

### Permission Model

```mermaid
graph LR
    subgraph "Permissions"
        P1[candidate.view]
        P2[candidate.create]
        P3[candidate.edit]
        P4[job.publish]
        P5[offer.approve]
    end

    subgraph "Roles"
        R1[Admin]
        R2[Recruiter]
        R3[Hiring Manager]
        R4[Interviewer]
    end

    subgraph "Users"
        U1[John - Admin]
        U2[Jane - Recruiter]
        U3[Bob - HM]
    end

    R1 --> P1 & P2 & P3 & P4 & P5
    R2 --> P1 & P2 & P3
    R3 --> P1 & P5
    R4 --> P1

    U1 --> R1
    U2 --> R2
    U3 --> R3
```

---

## Integration Architecture

### External Integrations

```mermaid
graph TB
    subgraph "TalentX Core"
        INT[Integrations Module]
    end

    subgraph "Job Boards"
        LI[LinkedIn]
        IND[Indeed]
        ZIP[ZipRecruiter]
    end

    subgraph "HRIS"
        WD[Workday]
        BHR[BambooHR]
        ADP[ADP]
    end

    subgraph "Calendar"
        GCAL[Google Calendar]
        OUT[Outlook]
    end

    subgraph "Communication"
        SLACK[Slack]
        TEAMS[MS Teams]
        EMAIL[Email/SMTP]
    end

    subgraph "Background Check"
        CHECKR[Checkr]
    end

    subgraph "E-Signature"
        DOCU[DocuSign]
    end

    INT --> LI & IND & ZIP
    INT --> WD & BHR & ADP
    INT --> GCAL & OUT
    INT --> SLACK & TEAMS & EMAIL
    INT --> CHECKR
    INT --> DOCU
```

### Webhook Event Flow

```mermaid
sequenceDiagram
    participant APP as TalentX
    participant QUEUE as Job Queue
    participant WORKER as Worker
    participant EXT as External System

    Note over APP: Event Occurs
    APP->>APP: Log Event
    APP->>QUEUE: Queue Webhook Job
    QUEUE-->>WORKER: Process Job
    WORKER->>WORKER: Build Payload
    WORKER->>WORKER: Sign Request
    WORKER->>EXT: POST Webhook
    alt Success
        EXT-->>WORKER: 200 OK
        WORKER->>APP: Mark Delivered
    else Failure
        EXT-->>WORKER: Error
        WORKER->>QUEUE: Retry (exponential backoff)
    end
```

---

## Deployment Architecture

### Cloud Architecture (AWS)

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "Public Subnet"
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
        end

        subgraph "Private Subnet - App"
            ECS[ECS Fargate<br/>API + Web]
        end

        subgraph "Private Subnet - Data"
            RDS[(RDS PostgreSQL<br/>Multi-AZ)]
            ELAST[(ElastiCache<br/>Redis)]
        end

        subgraph "Storage"
            S3_STORE[(S3 Bucket<br/>Uploads)]
        end

        subgraph "Monitoring"
            CW[CloudWatch]
            XRAY[X-Ray]
        end
    end

    USERS[Users] --> ALB
    ALB --> ECS
    ECS --> RDS
    ECS --> ELAST
    ECS --> S3_STORE
    ECS --> CW
    ECS --> XRAY
```

---

## Performance Considerations

### Caching Strategy

| Cache Layer | Use Case | TTL |
|-------------|----------|-----|
| **Browser** | Static assets | 1 year |
| **CDN** | Images, JS, CSS | 1 day |
| **Redis** | API responses | 5-60 min |
| **Database** | Query cache | Automatic |

### Query Optimization

- Indexed columns for frequent filters
- Pagination with cursor-based approach
- Selective field loading
- N+1 query prevention with includes

### Async Processing

- Resume parsing → Background job
- Email sending → Queue
- Report generation → Async with polling
- Webhook delivery → Queue with retry

---

## Scalability Roadmap

### Current (Monolith)
- Single API server
- Single database
- Redis for caching

### Phase 2 (Scale Out)
- Multiple API instances
- Database read replicas
- Redis cluster

### Phase 3 (Microservices)
- Separate services for:
  - Authentication
  - AI/ML processing
  - Notification delivery
  - Report generation
