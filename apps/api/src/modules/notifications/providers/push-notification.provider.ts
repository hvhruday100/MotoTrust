import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { NotificationDispatchPayload, NotificationProvider } from './notification-provider.interface';

@Injectable()
export class PushNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.PUSH;

  async queue(_payload: NotificationDispatchPayload): Promise<void> {
    // Phase 2 hook: wire this to a push provider without changing the notification API.
  }
}
