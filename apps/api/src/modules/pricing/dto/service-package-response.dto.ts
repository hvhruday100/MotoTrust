import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServicePackageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'ESSENTIAL_SERVICE' })
  code!: string;

  @ApiProperty({ example: 'Essential Service' })
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ example: 1299 })
  fixedPrice!: number;

  @ApiProperty({ example: 120 })
  estimatedMinutes!: number;
}

