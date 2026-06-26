import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { ApproveInspectionIssueDto } from './dto/approve-inspection-issue.dto';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { InspectionReportResponseDto } from './dto/inspection-report-response.dto';
import { InspectionsService } from './inspections.service';

@ApiTags('inspections')
@Controller()
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post('bookings/:bookingId/inspection-report')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mechanic/admin creates an inspection report for a booking.' })
  @ApiCreatedResponse({ type: InspectionReportResponseDto })
  createReport(@Param('bookingId') bookingId: string, @Body() dto: CreateInspectionReportDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.inspectionsService.createReport(bookingId, dto, user);
  }

  @Get('bookings/:bookingId/inspection-report')
  @ApiOperation({ summary: 'Get inspection report and approval summary for a booking.' })
  @ApiOkResponse({ type: InspectionReportResponseDto })
  getReport(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.inspectionsService.getReportByBookingId(bookingId, user);
  }

  @Patch('inspection-issues/:issueId/approval')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer approves or rejects one inspection issue.' })
  @ApiOkResponse({ type: InspectionReportResponseDto })
  approveIssue(@Param('issueId') issueId: string, @Body() dto: ApproveInspectionIssueDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.inspectionsService.approveIssue(issueId, dto, user);
  }
}
