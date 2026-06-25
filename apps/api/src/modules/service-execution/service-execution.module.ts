import { Module } from '@nestjs/common';
import { ServiceExecutionController } from './service-execution.controller';
import { ServiceExecutionService } from './service-execution.service';

@Module({
  controllers: [ServiceExecutionController],
  providers: [ServiceExecutionService],
  exports: [ServiceExecutionService]
})
export class ServiceExecutionModule {}
