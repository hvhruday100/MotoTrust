import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateMotorcycleDto {
  @ApiProperty({ example: 'KA01AB1234' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  registrationNumber!: string;

  @ApiProperty({ example: 'Royal Enfield' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  brand!: string;

  @ApiProperty({ example: 'Classic 350' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model!: string;

  @ApiPropertyOptional({ example: 'Signals Edition' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  variant?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 18500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number;
}

