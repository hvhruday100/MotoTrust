import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingActorType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { CreateInspectionIssueDto } from './create-inspection-issue.dto';

export class CreateInspectionReportDto {
  @ApiPropertyOptional({ example: 'Primary inspection identified brake and chain issues.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiProperty({ enum: BookingActorType, example: BookingActorType.MECHANIC })
  @IsEnum(BookingActorType)
  createdByType!: BookingActorType;

  @ApiPropertyOptional({ example: 'mechanic-user-001' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  createdById?: string;

  @ApiProperty({ example: 'Workshop Mechanic' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  createdByName!: string;

  @ApiProperty({ type: [CreateInspectionIssueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionIssueDto)
  issues!: CreateInspectionIssueDto[];
}

