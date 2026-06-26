import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueApprovalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveInspectionIssueDto {
  @ApiProperty({ enum: [IssueApprovalStatus.APPROVED, IssueApprovalStatus.REJECTED] })
  @IsEnum(IssueApprovalStatus)
  approvalStatus!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Please fix this issue before delivery.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
