import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaProofType, MediaVisibility } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProofMediaDto {
  @ApiProperty({ enum: MediaProofType, default: MediaProofType.PHOTO })
  @IsEnum(MediaProofType)
  type!: MediaProofType;

  @ApiPropertyOptional({ enum: MediaVisibility, default: MediaVisibility.CUSTOMER_VISIBLE })
  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: MediaVisibility;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  storageKey!: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(2048)
  storageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}
