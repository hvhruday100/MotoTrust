-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppNotification_dedupeKey_key" ON "AppNotification"("dedupeKey");

-- CreateIndex
CREATE INDEX "AppNotification_userId_createdAt_idx" ON "AppNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AppNotification_userId_readAt_idx" ON "AppNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AppNotification_bookingId_createdAt_idx" ON "AppNotification"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "AppNotification_category_idx" ON "AppNotification"("category");

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
