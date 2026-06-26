import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AddServiceTaskPartDto {
  @ApiProperty({ example: 'BP-SET-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  sku!: string;

  @ApiProperty({ example: 'Front Brake Pad Set' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Brembo' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  manufacturer!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isGenuine?: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 1450 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 'BATCH-24-09' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  batchCode?: string;
}
