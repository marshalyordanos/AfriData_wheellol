-- CreateTable
CREATE TABLE "public"."RentalRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalRequestEvent_requestId_createdAt_idx" ON "public"."RentalRequestEvent"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."RentalRequestEvent" ADD CONSTRAINT "RentalRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentalRequestEvent" ADD CONSTRAINT "RentalRequestEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
