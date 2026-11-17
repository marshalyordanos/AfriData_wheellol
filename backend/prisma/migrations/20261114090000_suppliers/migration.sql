-- Suppliers: car approval, commission settings, per-car price split

CREATE TYPE "public"."CarApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Existing cars stay visible: default APPROVED
ALTER TABLE "public"."Car"
  ADD COLUMN "approvalStatus" "public"."CarApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "public"."HostProfile"
  ADD COLUMN "businessName" TEXT,
  ADD COLUMN "nationalId" TEXT,
  ADD COLUMN "commissionRate" DOUBLE PRECISION;

ALTER TABLE "public"."RentalRequestCar"
  ADD COLUMN "price" DOUBLE PRECISION,
  ADD COLUMN "commissionRate" DOUBLE PRECISION,
  ADD COLUMN "commissionAmount" DOUBLE PRECISION,
  ADD COLUMN "supplierAmount" DOUBLE PRECISION;

-- Global default commission (10%) — editable in admin → Suppliers → Commission
INSERT INTO "public"."SystemSetting" ("id", "key", "value", "updatedAt")
VALUES ('supplier_commission_percent', 'SUPPLIER_COMMISSION_PERCENT', '10', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
