# Service Lifecycle Tracking

MotoTrust tracks booking progress using two layers:

1. `Booking.status`: current lifecycle state.
2. `BookingTimelineEvent`: append-only audit trail with timestamp and actor metadata.

## Booking States

- `CREATED`
- `CONFIRMED`
- `PICKUP_ASSIGNED`
- `PICKED_UP`
- `RECEIVED_AT_SERVICE_CENTER`
- `INSPECTION_COMPLETED`
- `AWAITING_CUSTOMER_APPROVAL`
- `APPROVED_FOR_SERVICE`
- `IN_SERVICE`
- `QUALITY_CHECK`
- `READY_FOR_DELIVERY`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`

## APIs

- `GET /api/admin/bookings`
- `GET /api/bookings/:bookingId`
- `PATCH /api/bookings/:bookingId/status`

Status updates require:

- `nextStatus`
- `actorType`
- `actorName`
- optional `actorId`
- optional `note`

The API validates every requested transition before updating the booking.

## Web

- Admin status updates: `/admin/bookings`
- Customer progress timeline: `/bookings/progress?bookingId=...`

## Migration Note

The schema change replaces the initial MVP booking states with the full lifecycle. If an existing database has bookings in removed states such as `DRAFT`, `PICKUP_SCHEDULED`, or `CONVERTED_TO_ORDER`, those rows should be mapped before applying a database migration.

