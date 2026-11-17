-- Contracts: reusable templates + one contract per booking request
CREATE TYPE "public"."ContractStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'VOID');

CREATE TABLE "public"."ContractTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "document" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."RentalContract" (
    "id" TEXT NOT NULL,
    "contractNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "requestId" TEXT NOT NULL,
    "templateId" TEXT,
    "document" JSONB NOT NULL,
    "values" JSONB NOT NULL,
    "html" TEXT,
    "publicToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "signerName" TEXT,
    "signatureImage" TEXT,
    "signerIp" TEXT,
    "signerAgent" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalContract_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentalContract_contractNo_key" ON "public"."RentalContract"("contractNo");
CREATE UNIQUE INDEX "RentalContract_publicToken_key" ON "public"."RentalContract"("publicToken");
CREATE INDEX "RentalContract_requestId_idx" ON "public"."RentalContract"("requestId");
CREATE INDEX "RentalContract_status_idx" ON "public"."RentalContract"("status");

ALTER TABLE "public"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."RentalContract" ADD CONSTRAINT "RentalContract_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."RentalContract" ADD CONSTRAINT "RentalContract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."RentalContract" ADD CONSTRAINT "RentalContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
