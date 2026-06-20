-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('SAFE', 'MISSING', 'RESOLVED');

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "magicLinkToken" TEXT NOT NULL,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "assignedIndex" INTEGER NOT NULL,
    "status" "ChildStatus" NOT NULL DEFAULT 'SAFE',
    "lastSeenLandmark" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_events" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "landmarkName" TEXT,
    "batteryLevel" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_phoneNumber_key" ON "parents"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "parents_magicLinkToken_key" ON "parents"("magicLinkToken");

-- CreateIndex
CREATE UNIQUE INDEX "children_bandId_key" ON "children"("bandId");

-- CreateIndex
CREATE INDEX "children_bandId_idx" ON "children"("bandId");

-- CreateIndex
CREATE INDEX "children_status_idx" ON "children"("status");

-- CreateIndex
CREATE UNIQUE INDEX "children_parentId_assignedIndex_key" ON "children"("parentId", "assignedIndex");

-- CreateIndex
CREATE INDEX "location_events_childId_recordedAt_idx" ON "location_events"("childId", "recordedAt" DESC);

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_events" ADD CONSTRAINT "location_events_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
