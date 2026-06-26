import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { NotificationDispatchPayload, NotificationProvider } from './notification-provider.interface';

@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.EMAIL;

  async queue(_payload: NotificationDispatchPayload): Promise<void> {
    // Phase 2 hook: wire this to an email provider without changing the notification API.
  }
}
