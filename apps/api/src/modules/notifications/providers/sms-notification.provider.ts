import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { NotificationDispatchPayload, NotificationProvider } from './notification-provider.interface';

@Injectable()
export class SmsNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.SMS;

  async queue(_payload: NotificationDispatchPayload): Promise<void> {
    // Phase 2 hook: wire this to an SMS provider without changing the notification API.
  }
}
