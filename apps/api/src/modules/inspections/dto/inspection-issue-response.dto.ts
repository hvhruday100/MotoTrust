import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionIssueSeverity, IssueApprovalStatus } from '@prisma/client';

export class InspectionIssueResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: InspectionIssueSeverity })
  severity!: InspectionIssueSeverity;

  @ApiProperty()
  estimatedPartsCost!: number;

  @ApiProperty()
  estimatedLaborCost!: number;

  @ApiProperty({ type: [String] })
  imageUrls!: string[];

  @ApiProperty({ enum: IssueApprovalStatus })
  approvalStatus!: IssueApprovalStatus;

  @ApiPropertyOptional()
  customerDecisionAt?: Date | null;

  @ApiPropertyOptional()
  customerDecisionById?: string | null;

  @ApiPropertyOptional()
  customerDecisionByName?: string | null;

  @ApiPropertyOptional()
  customerDecisionNote?: string | null;
}

