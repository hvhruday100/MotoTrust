import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationDeliveryHooksService } from './notification-delivery-hooks.service';
import { NotificationsService } from './notifications.service';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { PushNotificationProvider } from './providers/push-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDeliveryHooksService,
    EmailNotificationProvider,
    SmsNotificationProvider,
    PushNotificationProvider
  ],
  exports: [NotificationsService]
})
export class NotificationsModule {}
