import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { ServiceExecutionModule } from '../service-execution/service-execution.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PricingModule, ServiceExecutionModule],
  controllers: [BookingsController],
  providers: [BookingsService]
})
export class BookingsModule {}
