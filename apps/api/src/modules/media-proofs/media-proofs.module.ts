import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { InspectionsModule } from '../inspections/inspections.module';
import { ServiceExecutionModule } from '../service-execution/service-execution.module';
import { MediaProofsController } from './media-proofs.controller';
import { MediaProofsService } from './media-proofs.service';

@Module({
  imports: [BookingsModule, InspectionsModule, ServiceExecutionModule],
  controllers: [MediaProofsController],
  providers: [MediaProofsService]
})
export class MediaProofsModule {}
