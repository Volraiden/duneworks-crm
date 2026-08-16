-- CreateTable
CREATE TABLE "PossibleClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PossibleClient_outcome_idx" ON "PossibleClient"("outcome");

-- CreateIndex
CREATE INDEX "PossibleClient_company_idx" ON "PossibleClient"("company");
