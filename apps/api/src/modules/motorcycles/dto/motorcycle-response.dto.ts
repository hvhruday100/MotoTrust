import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MotorcycleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  registrationNumber!: string;

  @ApiProperty()
  brand!: string;

  @ApiProperty()
  model!: string;

  @ApiPropertyOptional()
  variant?: string | null;

  @ApiPropertyOptional()
  year?: number | null;

  @ApiPropertyOptional()
  odometerKm?: number | null;

  @ApiProperty()
  createdAt!: Date;
}

