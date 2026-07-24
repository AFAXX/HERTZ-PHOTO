CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "RentalContract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "vehiclePlate" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleColor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RentalContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhotoRequirement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelEn" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    CONSTRAINT "PhotoRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhotoSubmission" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "localPath" TEXT,
    "graphItemId" TEXT,
    "graphDriveId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhotoSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentalContract_contractNumber_key" ON "RentalContract"("contractNumber");
CREATE UNIQUE INDEX "AccessToken_token_key" ON "AccessToken"("token");
CREATE UNIQUE INDEX "PhotoRequirement_key_key" ON "PhotoRequirement"("key");
CREATE UNIQUE INDEX "PhotoSubmission_contractId_requirementId_key" ON "PhotoSubmission"("contractId", "requirementId");

ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhotoSubmission" ADD CONSTRAINT "PhotoSubmission_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhotoSubmission" ADD CONSTRAINT "PhotoSubmission_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "PhotoRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
