-- AddEnum InverterProvider
CREATE TYPE "InverterProvider" AS ENUM (
  'GROWATT', 'SOLIS', 'DEYE', 'FRONIUS', 'HUAWEI_FUSIONSOLAR',
  'WEG', 'ABB', 'SOFAR', 'GOODWE', 'CUSTOM'
);

-- AddEnum InvoiceStatus
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- AddEnum ContractStatus
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_SIGNATURE');

-- AddEnum TicketStatus
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AddEnum TicketPriority
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable plants: add inverterProvider and externalPlantId
ALTER TABLE "plants"
  ADD COLUMN "externalPlantId" TEXT,
  ADD COLUMN "inverterProvider" "InverterProvider" NOT NULL DEFAULT 'GROWATT';

-- CreateTable monitoring_credentials
CREATE TABLE "monitoring_credentials" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "provider"    "InverterProvider" NOT NULL,
  "username"    TEXT,
  "password"    TEXT,
  "apiKey"      TEXT,
  "apiSecret"   TEXT,
  "serverUrl"   TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "lastTestAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "monitoring_credentials_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "monitoring_credentials"
  ADD CONSTRAINT "monitoring_credentials_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable invoices
CREATE TABLE "invoices" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "clientId"             TEXT NOT NULL,
  "plantId"              TEXT,
  "referenceMonth"       TIMESTAMP(3) NOT NULL,
  "amount"               DOUBLE PRECISION NOT NULL,
  "status"               "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  "dueDate"              TIMESTAMP(3) NOT NULL,
  "paidAt"               TIMESTAMP(3),
  "abacatepayBillingId"  TEXT,
  "pixCode"              TEXT,
  "pixQrCode"            TEXT,
  "notes"                TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_plantId_fkey"
  FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable contracts
CREATE TABLE "contracts" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "clientId"        TEXT NOT NULL,
  "plantId"         TEXT,
  "title"           TEXT NOT NULL,
  "startDate"       TIMESTAMP(3) NOT NULL,
  "endDate"         TIMESTAMP(3),
  "monthlyAmount"   DOUBLE PRECISION NOT NULL,
  "adjustmentIndex" TEXT,
  "pdfUrl"          TEXT,
  "signedAt"        TIMESTAMP(3),
  "status"          "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON UPDATE CASCADE;

-- CreateTable tickets
CREATE TABLE "tickets" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "clientId"    TEXT,
  "plantId"     TEXT,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status"      "TicketStatus"   NOT NULL DEFAULT 'OPEN',
  "priority"    "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "category"    TEXT,
  "assignedTo"  TEXT,
  "resolvedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable ticket_messages
CREATE TABLE "ticket_messages" (
  "id"        TEXT NOT NULL,
  "ticketId"  TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "isStaff"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ticket_messages"
  ADD CONSTRAINT "ticket_messages_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
