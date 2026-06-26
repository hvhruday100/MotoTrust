import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServiceExecutionController } from './service-execution.controller';
import { ServiceExecutionService } from './service-execution.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ServiceExecutionController],
  providers: [ServiceExecutionService],
  exports: [ServiceExecutionService]
})
export class ServiceExecutionModule {}
