-- AlterEnum: add CLIENT role
ALTER TYPE "Role" ADD VALUE 'CLIENT';

-- CreateEnum
CREATE TYPE "PlantStatus" AS ENUM ('NORMAL', 'ALERT', 'CRITICAL', 'UNKNOWN', 'OFFLINE');

-- AlterTable: add portalUserId to clients
ALTER TABLE "clients" ADD COLUMN "portalUserId" TEXT;
ALTER TABLE "clients" ADD CONSTRAINT "clients_portalUserId_key" UNIQUE ("portalUserId");

-- CreateTable: plants
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "growattPlantId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "systemKwp" DOUBLE PRECISION,
    "installDate" TIMESTAMP(3),
    "status" "PlantStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: plant_devices
CREATE TABLE "plant_devices" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT,
    "brand" TEXT NOT NULL DEFAULT 'Growatt',
    "status" TEXT,
    "currentKw" DOUBLE PRECISION,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: plant_alerts
CREATE TABLE "plant_alerts" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deviceSn" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_alerts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: plants → users
ALTER TABLE "plants" ADD CONSTRAINT "plants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: plants → clients
ALTER TABLE "plants" ADD CONSTRAINT "plants_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: plant_devices → plants
ALTER TABLE "plant_devices" ADD CONSTRAINT "plant_devices_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: plant_alerts → plants
ALTER TABLE "plant_alerts" ADD CONSTRAINT "plant_alerts_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
