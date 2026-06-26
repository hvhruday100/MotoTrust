import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateInspectionIssueDto } from './create-inspection-issue.dto';

export class CreateInspectionReportDto {
  @ApiPropertyOptional({ example: 'Primary inspection identified brake and chain issues.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiProperty({ type: [CreateInspectionIssueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionIssueDto)
  issues!: CreateInspectionIssueDto[];
}
