# Deployment Guide

This guide covers deploying Ayphen TalentX to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling](#scaling)
- [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 100+ GB SSD |
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 14 | 15+ |
| Redis | 6.x | 7.x |

### Required Services

- PostgreSQL database
- Redis (for caching and job queues)
- S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces)
- SMTP server (for emails)
- Domain with SSL certificate

---

## Environment Setup

### Production Environment Variables

Create a `.env.production` file:

```env
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production
API_PORT=3001
WEB_URL=https://app.yourdomain.com
API_URL=https://api.yourdomain.com

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://user:password@db-host:5432/talentx?schema=public&sslmode=require"

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ===========================================
# REDIS
# ===========================================
REDIS_URL="redis://:password@redis-host:6379"

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET="generate-a-strong-64-char-secret-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Session settings
SESSION_SECRET="another-strong-secret"
SESSION_MAX_AGE=604800000

# ===========================================
# STORAGE (AWS S3)
# ===========================================
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="talentx-uploads-prod"
AWS_REGION="us-east-1"
AWS_S3_ENDPOINT=""  # Leave empty for AWS, set for S3-compatible services

# ===========================================
# EMAIL (SMTP)
# ===========================================
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
SMTP_FROM_NAME="TalentX"

# ===========================================
# AI SERVICES
# ===========================================
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"
OPENAI_MAX_TOKENS=4000

# ===========================================
# INTEGRATIONS
# ===========================================
# LinkedIn
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""

# DocuSign
DOCUSIGN_INTEGRATION_KEY=""
DOCUSIGN_SECRET_KEY=""
DOCUSIGN_ACCOUNT_ID=""

# ===========================================
# SECURITY
# ===========================================
CORS_ORIGINS="https://app.yourdomain.com,https://careers.yourdomain.com"
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# ===========================================
# MONITORING
# ===========================================
SENTRY_DSN=""
LOG_LEVEL="info"
```

---

## Docker Deployment

### Docker Compose (Simple)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: talentx
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: talentx
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfiles

**API Dockerfile** (`apps/api/Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter api build

FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN pnpm install --frozen-lockfile --prod
RUN cd apps/api && pnpm prisma generate

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
```

**Web Dockerfile** (`apps/web/Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter web build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/web/server.js"]
```

### Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: talentx

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: talentx-config
  namespace: talentx
data:
  NODE_ENV: "production"
  API_PORT: "3001"
  WEB_URL: "https://app.yourdomain.com"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: talentx-secrets
  namespace: talentx
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "..."
  REDIS_URL: "redis://..."
```

### API Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: talentx-api
  namespace: talentx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: talentx-api
  template:
    metadata:
      labels:
        app: talentx-api
    spec:
      containers:
        - name: api
          image: your-registry/talentx-api:latest
          ports:
            - containerPort: 3001
          envFrom:
            - configMapRef:
                name: talentx-config
            - secretRef:
                name: talentx-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: talentx-api
  namespace: talentx
spec:
  selector:
    app: talentx-api
  ports:
    - port: 3001
      targetPort: 3001
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: talentx-ingress
  namespace: talentx
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.yourdomain.com
        - app.yourdomain.com
      secretName: talentx-tls
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: talentx-api
                port:
                  number: 3001
    - host: app.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: talentx-web
                port:
                  number: 3000
```

---

## Database Setup

### Initial Setup

```bash
# Connect to database
psql -h db-host -U postgres

# Create database and user
CREATE USER talentx WITH PASSWORD 'secure-password';
CREATE DATABASE talentx OWNER talentx;
GRANT ALL PRIVILEGES ON DATABASE talentx TO talentx;

# Enable required extensions
\c talentx
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Run Migrations

```bash
# Production migration
pnpm --filter api prisma migrate deploy

# Generate client
pnpm --filter api prisma generate
```

### Seed Data (Optional)

```bash
pnpm --filter api prisma db seed
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/talentx
server {
    listen 80;
    server_name api.yourdomain.com app.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring & Logging

### Health Checks

The API exposes health check endpoints:

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/ready` - Readiness check (includes DB)
- `GET /api/v1/health/live` - Liveness check

### Logging

Configure structured logging:

```env
LOG_LEVEL=info
LOG_FORMAT=json
```

### Sentry Integration

```env
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Prometheus Metrics (Optional)

Expose metrics endpoint at `/metrics` for Prometheus scraping.

---

## Scaling

### Horizontal Scaling

- **API**: Stateless, can scale horizontally
- **Web**: Stateless, can scale horizontally
- **Database**: Use read replicas for scaling reads
- **Redis**: Use Redis Cluster for high availability

### Auto-scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: talentx-api-hpa
  namespace: talentx
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: talentx-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## Backup & Recovery

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h db-host -U talentx talentx | gzip > /backups/talentx_$DATE.sql.gz

# Upload to S3
aws s3 cp /backups/talentx_$DATE.sql.gz s3://your-backup-bucket/db/

# Keep only last 30 days locally
find /backups -name "*.sql.gz" -mtime +30 -delete
```

### Recovery

```bash
# Download backup
aws s3 cp s3://your-backup-bucket/db/talentx_20240101.sql.gz .

# Restore
gunzip -c talentx_20240101.sql.gz | psql -h db-host -U talentx talentx
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection timeout | Check `DATABASE_POOL_MAX` and connection limits |
| High memory usage | Adjust Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096` |
| Slow API responses | Check database indexes, enable query logging |
| File upload failures | Check S3 credentials and bucket permissions |

### Debug Mode

```env
DEBUG=true
LOG_LEVEL=debug
```

---

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Database SSL enabled
- [ ] Redis password set
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Secrets in environment variables (not in code)
- [ ] Regular dependency updates
- [ ] Audit logs enabled
