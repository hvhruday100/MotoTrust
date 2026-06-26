-- CreateTable
CREATE TABLE "ProofMediaAsset" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "inspectionIssueId" TEXT,
    "serviceTaskId" TEXT,
    "uploadedById" TEXT,
    "type" "MediaProofType" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'CUSTOMER_VISIBLE',
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileName" TEXT,
    "label" TEXT,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProofMediaAsset_bookingId_createdAt_idx" ON "ProofMediaAsset"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "ProofMediaAsset_inspectionIssueId_idx" ON "ProofMediaAsset"("inspectionIssueId");

-- CreateIndex
CREATE INDEX "ProofMediaAsset_serviceTaskId_idx" ON "ProofMediaAsset"("serviceTaskId");

-- CreateIndex
CREATE INDEX "ProofMediaAsset_visibility_idx" ON "ProofMediaAsset"("visibility");

-- AddForeignKey
ALTER TABLE "ProofMediaAsset" ADD CONSTRAINT "ProofMediaAsset_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofMediaAsset" ADD CONSTRAINT "ProofMediaAsset_inspectionIssueId_fkey" FOREIGN KEY ("inspectionIssueId") REFERENCES "InspectionIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofMediaAsset" ADD CONSTRAINT "ProofMediaAsset_serviceTaskId_fkey" FOREIGN KEY ("serviceTaskId") REFERENCES "ServiceTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofMediaAsset" ADD CONSTRAINT "ProofMediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
