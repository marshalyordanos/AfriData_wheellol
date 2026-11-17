-- Car photo slots (Front, Back, ...) and car documents (Libre, insurance, ...)
ALTER TABLE "Car" ADD COLUMN "photoSlots" JSONB;
ALTER TABLE "Car" ADD COLUMN "documents" JSONB;
