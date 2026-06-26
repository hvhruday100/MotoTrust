import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PricingModule } from '../pricing/pricing.module';
import { ServiceExecutionModule } from '../service-execution/service-execution.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PricingModule, ServiceExecutionModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService]
})
export class BookingsModule {}
