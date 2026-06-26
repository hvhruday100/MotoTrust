import { NotificationChannel } from '@prisma/client';

export type NotificationDispatchPayload = {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  bookingId?: string | null;
};

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  queue(payload: NotificationDispatchPayload): Promise<void>;
}
