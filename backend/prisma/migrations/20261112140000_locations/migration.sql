-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('REGION', 'CITY_ADMINISTRATION', 'CITY');

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAm" TEXT,
    "type" "public"."LocationType" NOT NULL DEFAULT 'REGION',
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPickup" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "public"."Location"("name");
CREATE INDEX "Location_isActive_sortOrder_idx" ON "public"."Location"("isActive", "sortOrder");

-- Seed: Ethiopia's two city administrations and regional states,
-- plus Jijiga (it was a pickup city before locations became dynamic).
INSERT INTO "public"."Location" ("id", "name", "nameAm", "type", "region", "latitude", "longitude", "isPickup", "sortOrder", "updatedAt") VALUES
  ('loc_addis_ababa',   'Addis Ababa',               'አዲስ አበባ',          'CITY_ADMINISTRATION', NULL,     9.0306, 38.7469, true,  1, CURRENT_TIMESTAMP),
  ('loc_dire_dawa',     'Dire Dawa',                 'ድሬ ዳዋ',            'CITY_ADMINISTRATION', NULL,     9.5930, 41.8661, true,  2, CURRENT_TIMESTAMP),
  ('loc_afar',          'Afar',                      'አፋር',              'REGION',              NULL,    11.7559, 40.9587, true,  3, CURRENT_TIMESTAMP),
  ('loc_amhara',        'Amhara',                    'አማራ',              'REGION',              NULL,    11.5936, 37.3908, true,  4, CURRENT_TIMESTAMP),
  ('loc_benishangul',   'Benishangul-Gumuz',         'ቤኒሻንጉል ጉሙዝ',       'REGION',              NULL,    10.0667, 34.5333, true,  5, CURRENT_TIMESTAMP),
  ('loc_central_eth',   'Central Ethiopia',          'ማዕከላዊ ኢትዮጵያ',      'REGION',              NULL,     7.5500, 37.8500, true,  6, CURRENT_TIMESTAMP),
  ('loc_gambela',       'Gambela',                   'ጋምቤላ',             'REGION',              NULL,     8.2500, 34.5833, true,  7, CURRENT_TIMESTAMP),
  ('loc_harari',        'Harari',                    'ሐረሪ',              'REGION',              NULL,     9.3126, 42.1227, true,  8, CURRENT_TIMESTAMP),
  ('loc_oromia',        'Oromia',                    'ኦሮሚያ',             'REGION',              NULL,     8.5400, 39.2700, true,  9, CURRENT_TIMESTAMP),
  ('loc_sidama',        'Sidama',                    'ሲዳማ',              'REGION',              NULL,     7.0629, 38.4766, true, 10, CURRENT_TIMESTAMP),
  ('loc_somali',        'Somali',                    'ሶማሌ',              'REGION',              NULL,     9.3500, 42.8000, true, 11, CURRENT_TIMESTAMP),
  ('loc_south_eth',     'South Ethiopia',            'ደቡብ ኢትዮጵያ',        'REGION',              NULL,     6.0333, 37.5500, true, 12, CURRENT_TIMESTAMP),
  ('loc_south_west',    'South West Ethiopia',       'ደቡብ ምዕራብ ኢትዮጵያ',   'REGION',              NULL,     7.2333, 35.6000, true, 13, CURRENT_TIMESTAMP),
  ('loc_tigray',        'Tigray',                    'ትግራይ',             'REGION',              NULL,    13.4967, 39.4753, true, 14, CURRENT_TIMESTAMP),
  ('loc_jijiga',        'Jijiga',                    'ጅጅጋ',              'CITY',                'Somali', 9.3500, 42.8000, true, 15, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Permission row so roles can be given access to Locations
INSERT INTO "public"."Permission" ("id", "resource", "description", "updatedAt")
VALUES ('perm_location', 'LOCATION', 'Manage pickup cities and regions', CURRENT_TIMESTAMP)
ON CONFLICT ("resource") DO NOTHING;
