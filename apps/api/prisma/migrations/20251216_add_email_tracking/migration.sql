-- CreateTable
CREATE TABLE "email_tracking_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "email_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_tracking_links" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tracking_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_tracking_events_campaignId_idx" ON "email_tracking_events"("campaignId");

-- CreateIndex
CREATE INDEX "email_tracking_events_candidateId_idx" ON "email_tracking_events"("candidateId");

-- CreateIndex
CREATE INDEX "email_tracking_events_eventType_idx" ON "email_tracking_events"("eventType");

-- CreateIndex
CREATE INDEX "email_tracking_events_tenantId_idx" ON "email_tracking_events"("tenantId");

-- CreateIndex
CREATE INDEX "email_tracking_events_createdAt_idx" ON "email_tracking_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_tracking_links_trackingToken_key" ON "email_tracking_links"("trackingToken");

-- CreateIndex
CREATE INDEX "email_tracking_links_campaignId_idx" ON "email_tracking_links"("campaignId");
