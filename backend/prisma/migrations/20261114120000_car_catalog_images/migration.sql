-- Car catalog: pictures + Ethiopian local names (all optional)
ALTER TABLE "public"."CarMake" ADD COLUMN "logo" TEXT;

ALTER TABLE "public"."CarModel"
  ADD COLUMN "localName" TEXT,
  ADD COLUMN "image" TEXT;

ALTER TABLE "public"."CarType"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "image" TEXT;
