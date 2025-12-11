-- Calendar Integration & E-Signature Models

-- Calendar Provider Enum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'OUTLOOK');

-- E-Signature Provider Enum  
CREATE TYPE "ESignatureProvider" AS ENUM ('DOCUSIGN', 'ADOBE_SIGN', 'ZOHO_SIGN');

-- E-Signature Status Enum
CREATE TYPE "ESignatureStatus" AS ENUM ('CREATED', 'SENT', 'DELIVERED', 'VIEWED', 'SIGNED', 'DECLINED', 'VOIDED', 'EXPIRED');

-- Calendar Connections Table
CREATE TABLE "calendar_connections" (
    "id" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "calendarId" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- Calendar Events Table (for caching/tracking)
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "provider" "CalendarProvider" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "attendees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "interviewId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- E-Signature Envelopes Table
CREATE TABLE "esignature_envelopes" (
    "id" TEXT NOT NULL,
    "provider" "ESignatureProvider" NOT NULL DEFAULT 'DOCUSIGN',
    "externalId" TEXT,
    "status" "ESignatureStatus" NOT NULL DEFAULT 'CREATED',
    "documentUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "signers" JSONB NOT NULL DEFAULT '[]',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "webhookEvents" JSONB DEFAULT '[]',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "esignature_envelopes_pkey" PRIMARY KEY ("id")
);

-- E-Signature Settings Table (per tenant)
CREATE TABLE "esignature_settings" (
    "id" TEXT NOT NULL,
    "provider" "ESignatureProvider" NOT NULL DEFAULT 'DOCUSIGN',
    "clientId" TEXT,
    "clientSecret" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "accountId" TEXT,
    "baseUrl" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "esignature_settings_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "calendar_connections_userId_idx" ON "calendar_connections"("userId");
CREATE UNIQUE INDEX "calendar_connections_userId_provider_key" ON "calendar_connections"("userId", "provider");

CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");
CREATE INDEX "calendar_events_interviewId_idx" ON "calendar_events"("interviewId");
CREATE INDEX "calendar_events_startTime_idx" ON "calendar_events"("startTime");

CREATE UNIQUE INDEX "esignature_envelopes_offerId_key" ON "esignature_envelopes"("offerId");
CREATE INDEX "esignature_envelopes_status_idx" ON "esignature_envelopes"("status");

CREATE UNIQUE INDEX "esignature_settings_tenantId_key" ON "esignature_settings"("tenantId");

-- Foreign Keys
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "esignature_envelopes" ADD CONSTRAINT "esignature_envelopes_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "esignature_settings" ADD CONSTRAINT "esignature_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add docusign fields to Offer
ALTER TABLE "offers" ADD COLUMN "esignatureEnvelopeId" TEXT;
