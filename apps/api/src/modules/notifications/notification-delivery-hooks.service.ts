import { Injectable } from '@nestjs/common';
import {
  NotificationDispatchPayload,
  NotificationProvider
} from './providers/notification-provider.interface';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { PushNotificationProvider } from './providers/push-notification.provider';

@Injectable()
export class NotificationDeliveryHooksService {
  private readonly providers: NotificationProvider[];

  constructor(
    emailProvider: EmailNotificationProvider,
    smsProvider: SmsNotificationProvider,
    pushProvider: PushNotificationProvider
  ) {
    this.providers = [emailProvider, smsProvider, pushProvider];
  }

  async queuePhaseTwoHooks(_payload: NotificationDispatchPayload): Promise<void> {
    await Promise.all(this.providers.map((provider) => provider.queue(_payload)));
  }
}
