-- Expand the booking lifecycle enum without losing existing rows.
CREATE TYPE "BookingStatus_new" AS ENUM (
  'CREATED',
  'CONFIRMED',
  'PICKUP_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_SERVICE_CENTER',
  'INSPECTION_COMPLETED',
  'AWAITING_CUSTOMER_APPROVAL',
  'APPROVED_FOR_SERVICE',
  'IN_SERVICE',
  'QUALITY_CHECK',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);

ALTER TABLE "Booking"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Booking"
ALTER COLUMN "status" TYPE "BookingStatus_new"
USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'CREATED'
    WHEN 'CONFIRMED' THEN 'CONFIRMED'
    WHEN 'PICKUP_SCHEDULED' THEN 'PICKUP_ASSIGNED'
    WHEN 'PICKED_UP' THEN 'PICKED_UP'
    WHEN 'CANCELLED' THEN 'CANCELLED'
    WHEN 'CONVERTED_TO_ORDER' THEN 'RECEIVED_AT_SERVICE_CENTER'
    ELSE 'CREATED'
  END
)::"BookingStatus_new";

ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";

ALTER TABLE "Booking"
ALTER COLUMN "status" SET DEFAULT 'CREATED';

CREATE TYPE "BookingActorType" AS ENUM ('CUSTOMER', 'OPS', 'MECHANIC', 'ADMIN', 'SYSTEM');

CREATE TABLE "BookingTimelineEvent" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "fromStatus" "BookingStatus",
  "toStatus" "BookingStatus" NOT NULL,
  "actorType" "BookingActorType" NOT NULL,
  "actorId" TEXT,
  "actorName" TEXT NOT NULL,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BookingTimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingTimelineEvent_bookingId_createdAt_idx"
ON "BookingTimelineEvent"("bookingId", "createdAt");

CREATE INDEX "BookingTimelineEvent_toStatus_idx"
ON "BookingTimelineEvent"("toStatus");

CREATE INDEX "BookingTimelineEvent_actorType_idx"
ON "BookingTimelineEvent"("actorType");

ALTER TABLE "BookingTimelineEvent"
ADD CONSTRAINT "BookingTimelineEvent_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

INSERT INTO "BookingTimelineEvent" (
  "id",
  "bookingId",
  "fromStatus",
  "toStatus",
  "actorType",
  "actorName",
  "note",
  "createdAt"
)
SELECT
  'migr_' || "id",
  "id",
  NULL,
  "status",
  'SYSTEM',
  'Migration',
  'Backfilled during booking lifecycle migration.',
  "createdAt"
FROM "Booking";
