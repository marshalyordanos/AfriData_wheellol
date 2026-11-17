-- Saved e-signature on the customer's profile
ALTER TABLE "public"."User" ADD COLUMN "signatureImage" TEXT;
ALTER TABLE "public"."User" ADD COLUMN "signatureUpdatedAt" TIMESTAMP(3);
