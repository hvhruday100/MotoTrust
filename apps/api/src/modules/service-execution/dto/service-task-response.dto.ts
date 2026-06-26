import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProofMediaResponseDto } from '../../media-proofs/dto/proof-media-response.dto';
import { ServicePartUsageResponseDto } from './service-part-usage-response.dto';

export class ServiceTaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  serviceOrderId!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiProperty()
  bookingStatus!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] })
  status!: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiPropertyOptional()
  assignedMechanicId?: string | null;

  @ApiPropertyOptional()
  assignedMechanicName?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  completedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [ServicePartUsageResponseDto] })
  partsUsed!: ServicePartUsageResponseDto[];

  @ApiProperty({ type: [ProofMediaResponseDto] })
  proofMedia!: ProofMediaResponseDto[];
}
