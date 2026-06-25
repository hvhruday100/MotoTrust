import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionIssueSeverity } from '@prisma/client';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInspectionIssueDto {
  @ApiProperty({ example: 'Front brake pads worn out' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Pads are below safe thickness and should be replaced.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: InspectionIssueSeverity })
  @IsEnum(InspectionIssueSeverity)
  severity!: InspectionIssueSeverity;

  @ApiProperty({ example: 750 })
  @IsNumber({ maxDecimalPlaces: 2 })
  estimatedPartsCost!: number;

  @ApiProperty({ example: 250 })
  @IsNumber({ maxDecimalPlaces: 2 })
  estimatedLaborCost!: number;

  @ApiPropertyOptional({ type: [String], example: ['https://mock-storage.local/brakes-1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

