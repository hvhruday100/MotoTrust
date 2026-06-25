ALTER TYPE "ServiceTaskStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TABLE "ServiceTask"
ADD COLUMN "assignedMechanicId" TEXT,
ADD COLUMN "assignedMechanicName" TEXT,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "notes" TEXT;

ALTER TABLE "ServiceOrderPart"
ADD COLUMN "serviceTaskId" TEXT;

ALTER TABLE "ServiceOrderPart"
ADD CONSTRAINT "ServiceOrderPart_serviceTaskId_fkey"
FOREIGN KEY ("serviceTaskId") REFERENCES "ServiceTask"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "ServiceTask_serviceOrderId_status_idx" ON "ServiceTask"("serviceOrderId", "status");
CREATE INDEX "ServiceTask_assignedMechanicId_status_idx" ON "ServiceTask"("assignedMechanicId", "status");
CREATE INDEX "ServiceOrderPart_serviceOrderId_idx" ON "ServiceOrderPart"("serviceOrderId");
CREATE INDEX "ServiceOrderPart_serviceTaskId_idx" ON "ServiceOrderPart"("serviceTaskId");
CREATE INDEX "ServiceOrderPart_partId_idx" ON "ServiceOrderPart"("partId");
