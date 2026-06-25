import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServicePartUsageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  partId!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  manufacturer!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  totalPrice!: number;

  @ApiPropertyOptional()
  batchCode?: string | null;

  @ApiPropertyOptional()
  verifiedAt?: Date | null;
}
