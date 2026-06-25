CREATE TYPE "InspectionIssueSeverity" AS ENUM ('CRITICAL', 'RECOMMENDED', 'OPTIONAL');

CREATE TYPE "IssueApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "InspectionReport" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "summary" TEXT,
  "createdByType" "BookingActorType" NOT NULL,
  "createdById" TEXT,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionIssue" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "severity" "InspectionIssueSeverity" NOT NULL,
  "estimatedPartsCost" DECIMAL(10,2) NOT NULL,
  "estimatedLaborCost" DECIMAL(10,2) NOT NULL,
  "imageUrls" JSONB,
  "approvalStatus" "IssueApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "customerDecisionAt" TIMESTAMP(3),
  "customerDecisionById" TEXT,
  "customerDecisionByName" TEXT,
  "customerDecisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InspectionIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InspectionReport_bookingId_key" ON "InspectionReport"("bookingId");
CREATE INDEX "InspectionReport_createdAt_idx" ON "InspectionReport"("createdAt");
CREATE INDEX "InspectionIssue_reportId_idx" ON "InspectionIssue"("reportId");
CREATE INDEX "InspectionIssue_severity_idx" ON "InspectionIssue"("severity");
CREATE INDEX "InspectionIssue_approvalStatus_idx" ON "InspectionIssue"("approvalStatus");

ALTER TABLE "InspectionReport"
ADD CONSTRAINT "InspectionReport_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "InspectionIssue"
ADD CONSTRAINT "InspectionIssue_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "InspectionReport"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
