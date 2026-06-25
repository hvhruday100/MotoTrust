import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueApprovalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApproveInspectionIssueDto {
  @ApiProperty({ enum: [IssueApprovalStatus.APPROVED, IssueApprovalStatus.REJECTED] })
  @IsEnum(IssueApprovalStatus)
  approvalStatus!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'customer-user-001' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  actorId?: string;

  @ApiProperty({ example: 'MotoTrust Customer' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  actorName!: string;

  @ApiPropertyOptional({ example: 'Please fix this issue before delivery.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
