import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

@Module({
  imports: [NotificationsModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService]
})
export class InspectionsModule {}
