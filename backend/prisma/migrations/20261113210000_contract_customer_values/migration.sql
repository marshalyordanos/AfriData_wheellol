-- Values the customer types when signing a contract (e.g. position)
ALTER TABLE "public"."RentalContract" ADD COLUMN "customerValues" JSONB;
