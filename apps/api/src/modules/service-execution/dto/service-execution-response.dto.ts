import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceTaskResponseDto } from './service-task-response.dto';

export class ServiceExecutionResponseDto {
  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  bookingStatus!: string;

  @ApiProperty()
  serviceOrderId!: string;

  @ApiProperty()
  serviceOrderStatus!: string;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty({ type: [ServiceTaskResponseDto] })
  tasks!: ServiceTaskResponseDto[];
}
