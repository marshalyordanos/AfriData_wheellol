-- CreateTable
CREATE TABLE "public"."PlatformContactInfo" (
    "id" TEXT NOT NULL,
    "phoneOne" TEXT,
    "phoneTwo" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "telegram" TEXT,
    "whatsapp" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Ethiopia',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformContactInfo_pkey" PRIMARY KEY ("id")
);
