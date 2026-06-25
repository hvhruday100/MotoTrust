import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingActorType } from '@prisma/client';
import { InspectionIssueResponseDto } from './inspection-issue-response.dto';

export class InspectionApprovalSummaryDto {
  @ApiProperty()
  totalIssues!: number;

  @ApiProperty()
  pendingIssues!: number;

  @ApiProperty()
  criticalIssues!: number;

  @ApiProperty()
  criticalApproved!: number;

  @ApiProperty()
  criticalRejected!: number;

  @ApiProperty()
  approvalComplete!: boolean;

  @ApiProperty()
  allCriticalApproved!: boolean;

  @ApiProperty()
  canStartService!: boolean;
}

export class InspectionReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookingId!: string;

  @ApiPropertyOptional()
  summary?: string | null;

  @ApiProperty({ enum: BookingActorType })
  createdByType!: BookingActorType;

  @ApiPropertyOptional()
  createdById?: string | null;

  @ApiProperty()
  createdByName!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [InspectionIssueResponseDto] })
  issues!: InspectionIssueResponseDto[];

  @ApiProperty({ type: InspectionApprovalSummaryDto })
  approvalSummary!: InspectionApprovalSummaryDto;
}

