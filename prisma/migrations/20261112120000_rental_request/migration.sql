-- CreateEnum
CREATE TYPE "public"."RentalRequestStatus" AS ENUM ('PENDING', 'UNDER_NEGOTIATION', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RentalPaymentMethod" AS ENUM ('CASH', 'TELEBIRR', 'CHAPA', 'BANK_TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Car" ALTER COLUMN "dailyRate" SET DEFAULT 0,
ALTER COLUMN "rentalPricePerDay" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."RentalRequest" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "customerId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "pickupCity" TEXT NOT NULL,
    "destinations" TEXT[],
    "purpose" TEXT NOT NULL,
    "ruralAccess" BOOLEAN NOT NULL DEFAULT false,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "note" TEXT,
    "status" "public"."RentalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" DOUBLE PRECISION,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RentalRequestCar" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "RentalRequestCar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RentalPayment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "public"."RentalPaymentMethod" NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentalRequest_trackingCode_key" ON "public"."RentalRequest"("trackingCode");

-- CreateIndex
CREATE INDEX "RentalRequest_customerId_idx" ON "public"."RentalRequest"("customerId");

-- CreateIndex
CREATE INDEX "RentalRequest_status_idx" ON "public"."RentalRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RentalRequestCar_requestId_carId_key" ON "public"."RentalRequestCar"("requestId", "carId");

-- CreateIndex
CREATE INDEX "RentalPayment_requestId_idx" ON "public"."RentalPayment"("requestId");

-- AddForeignKey
ALTER TABLE "public"."RentalRequest" ADD CONSTRAINT "RentalRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentalRequestCar" ADD CONSTRAINT "RentalRequestCar_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentalRequestCar" ADD CONSTRAINT "RentalRequestCar_carId_fkey" FOREIGN KEY ("carId") REFERENCES "public"."Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentalPayment" ADD CONSTRAINT "RentalPayment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentalPayment" ADD CONSTRAINT "RentalPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

