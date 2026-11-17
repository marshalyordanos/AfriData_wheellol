-- Car history (supplier cars: review decisions, edits, hide / show)
CREATE TABLE "public"."CarEvent" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CarEvent_carId_createdAt_idx" ON "public"."CarEvent"("carId", "createdAt");

ALTER TABLE "public"."CarEvent" ADD CONSTRAINT "CarEvent_carId_fkey" FOREIGN KEY ("carId") REFERENCES "public"."Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CarEvent" ADD CONSTRAINT "CarEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
