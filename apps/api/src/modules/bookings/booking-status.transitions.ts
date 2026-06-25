import { BookingStatus } from '@prisma/client';

export const BOOKING_STATUS_SEQUENCE: BookingStatus[] = [
  BookingStatus.CREATED,
  BookingStatus.CONFIRMED,
  BookingStatus.PICKUP_ASSIGNED,
  BookingStatus.PICKED_UP,
  BookingStatus.RECEIVED_AT_SERVICE_CENTER,
  BookingStatus.INSPECTION_COMPLETED,
  BookingStatus.AWAITING_CUSTOMER_APPROVAL,
  BookingStatus.APPROVED_FOR_SERVICE,
  BookingStatus.IN_SERVICE,
  BookingStatus.QUALITY_CHECK,
  BookingStatus.READY_FOR_DELIVERY,
  BookingStatus.OUT_FOR_DELIVERY,
  BookingStatus.DELIVERED
];

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.CREATED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.PICKUP_ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.PICKUP_ASSIGNED]: [BookingStatus.PICKED_UP, BookingStatus.CANCELLED],
  [BookingStatus.PICKED_UP]: [BookingStatus.RECEIVED_AT_SERVICE_CENTER, BookingStatus.CANCELLED],
  [BookingStatus.RECEIVED_AT_SERVICE_CENTER]: [BookingStatus.INSPECTION_COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.INSPECTION_COMPLETED]: [
    BookingStatus.AWAITING_CUSTOMER_APPROVAL,
    BookingStatus.APPROVED_FOR_SERVICE,
    BookingStatus.CANCELLED
  ],
  [BookingStatus.AWAITING_CUSTOMER_APPROVAL]: [BookingStatus.APPROVED_FOR_SERVICE, BookingStatus.CANCELLED],
  [BookingStatus.APPROVED_FOR_SERVICE]: [BookingStatus.IN_SERVICE, BookingStatus.CANCELLED],
  [BookingStatus.IN_SERVICE]: [BookingStatus.QUALITY_CHECK, BookingStatus.CANCELLED],
  [BookingStatus.QUALITY_CHECK]: [BookingStatus.READY_FOR_DELIVERY, BookingStatus.IN_SERVICE, BookingStatus.CANCELLED],
  [BookingStatus.READY_FOR_DELIVERY]: [BookingStatus.OUT_FOR_DELIVERY],
  [BookingStatus.OUT_FOR_DELIVERY]: [BookingStatus.DELIVERED],
  [BookingStatus.DELIVERED]: [],
  [BookingStatus.CANCELLED]: []
};

export function getAllowedNextStatuses(status: BookingStatus): BookingStatus[] {
  return BOOKING_STATUS_TRANSITIONS[status] ?? [];
}

export function isAllowedTransition(fromStatus: BookingStatus, toStatus: BookingStatus): boolean {
  return getAllowedNextStatuses(fromStatus).includes(toStatus);
}

