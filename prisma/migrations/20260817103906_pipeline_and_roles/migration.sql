-- DropIndex
DROP INDEX IF EXISTS "PossibleClient_company_idx";

-- DropIndex
DROP INDEX IF EXISTS "PossibleClient_outcome_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "PossibleClient";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'custom',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "PipelineStage" ("id", "name", "slug", "color", "sortOrder", "kind", "createdAt", "updatedAt") VALUES
  ('stage_possible', 'Possible Clients', 'possible-clients', '#c4b49a', 0, 'possible', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_contacted', 'Contacted', 'contacted', '#8fa6c2', 1, 'contacted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_demo', 'Demo Scheduled', 'demo-scheduled', '#c9a45c', 2, 'demo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_discussion', 'In Discussion', 'in-discussion', '#b08968', 3, 'discussion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_trial', 'Trial', 'trial', '#7d9b76', 4, 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_paid', 'Paid Client', 'paid-client', '#d4c4a8', 5, 'paid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('stage_denied', 'Denied', 'denied', '#8a5a52', 6, 'denied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL DEFAULT '',
    "toStage" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientActivity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "potentialValue" REAL NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT '',
    "assignedUserId" TEXT,
    "stageId" TEXT NOT NULL DEFAULT 'stage_possible',
    "status" TEXT NOT NULL DEFAULT 'Lead',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" (
    "id", "clientNumber", "name", "company", "industry", "email", "phone",
    "potentialValue", "source", "assignedUserId", "stageId", "status", "tags",
    "notes", "sortOrder", "lastActivity", "createdAt", "updatedAt"
)
SELECT
    "id",
    'DW-' || (1023 + rowid),
    "name",
    "company",
    '',
    "email",
    "phone",
    0,
    '',
    NULL,
    CASE
      WHEN "status" = 'Active' THEN 'stage_paid'
      WHEN "status" = 'Completed' THEN 'stage_paid'
      WHEN "status" = 'Paused' THEN 'stage_discussion'
      WHEN "status" = 'Denied' THEN 'stage_denied'
      ELSE 'stage_possible'
    END,
    "status",
    "tags",
    "notes",
    0,
    "lastActivity",
    "createdAt",
    "updatedAt"
FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "Client"("clientNumber");
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_company_idx" ON "Client"("company");
CREATE INDEX "Client_stageId_idx" ON "Client"("stageId");
CREATE INDEX "Client_assignedUserId_idx" ON "Client"("assignedUserId");
CREATE INDEX "Client_source_idx" ON "Client"("source");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Viewer',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_active_idx" ON "User"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_slug_key" ON "PipelineStage"("slug");

-- CreateIndex
CREATE INDEX "PipelineStage_sortOrder_idx" ON "PipelineStage"("sortOrder");

-- CreateIndex
CREATE INDEX "ClientNote_clientId_idx" ON "ClientNote"("clientId");

-- CreateIndex
CREATE INDEX "ClientNote_createdAt_idx" ON "ClientNote"("createdAt");

-- CreateIndex
CREATE INDEX "ClientActivity_clientId_idx" ON "ClientActivity"("clientId");

-- CreateIndex
CREATE INDEX "ClientActivity_createdAt_idx" ON "ClientActivity"("createdAt");
