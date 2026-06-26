import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, IssueApprovalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { ApproveInspectionIssueDto } from './dto/approve-inspection-issue.dto';
import { CreateInspectionReportDto } from './dto/create-inspection-report.dto';
import { InspectionIssueResponseDto } from './dto/inspection-issue-response.dto';
import { InspectionApprovalSummaryDto, InspectionReportResponseDto } from './dto/inspection-report-response.dto';
import { InspectionReportWithRelations } from './types/inspection-report-with-relations.type';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async createReport(
    bookingId: string,
    dto: CreateInspectionReportDto,
    user: AuthenticatedAppUser
  ): Promise<InspectionReportResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { inspectionReport: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.DELIVERED) {
      throw new BadRequestException('Inspection reports cannot be created for cancelled or delivered bookings.');
    }

    if (booking.inspectionReport) {
      throw new ConflictException('Inspection report already exists for this booking.');
    }

    if (!dto.issues.length) {
      throw new BadRequestException('At least one inspection issue is required.');
    }

    const actor = this.authService.toTimelineActor(user);

    const report = await this.prisma.$transaction(async (tx) => {
      const created = await tx.inspectionReport.create({
        data: {
          bookingId,
          summary: dto.summary?.trim(),
          createdByType: actor.actorType,
          createdById: actor.actorId,
          createdByName: actor.actorName,
          issues: {
            create: dto.issues.map((issue) => ({
              title: issue.title.trim(),
              description: issue.description?.trim(),
              severity: issue.severity,
              estimatedPartsCost: new Prisma.Decimal(issue.estimatedPartsCost),
              estimatedLaborCost: new Prisma.Decimal(issue.estimatedLaborCost),
              imageUrls: issue.imageUrls ?? []
            }))
          }
        },
        include: {
          issues: { orderBy: { createdAt: 'asc' } },
          booking: true
        }
      });

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: 'Inspection report created.',
          metadata: {
            action: 'INSPECTION_REPORT_CREATED',
            issueCount: dto.issues.length
          }
        }
      });

      return created;
    });

    return this.toReportResponse(report);
  }

  async getReportByBookingId(bookingId: string, user: AuthenticatedAppUser): Promise<InspectionReportResponseDto> {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { bookingId },
      include: {
        issues: { orderBy: { createdAt: 'asc' } },
        booking: true
      }
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found for this booking.');
    }

    this.assertBookingAccess(report.booking.customerId, user);

    return this.toReportResponse(report);
  }

  async approveIssue(
    issueId: string,
    dto: ApproveInspectionIssueDto,
    user: AuthenticatedAppUser
  ): Promise<InspectionReportResponseDto> {
    const issue = await this.prisma.inspectionIssue.findUnique({
      where: { id: issueId },
      include: {
        report: {
          include: {
            booking: true,
            issues: true
          }
        }
      }
    });

    if (!issue) {
      throw new NotFoundException('Inspection issue not found.');
    }

    this.assertBookingAccess(issue.report.booking.customerId, user);

    if (issue.approvalStatus !== IssueApprovalStatus.PENDING) {
      throw new BadRequestException('Inspection issue has already been decided.');
    }

    const actor = this.authService.toTimelineActor(user);

    const report = await this.prisma.$transaction(async (tx) => {
      await tx.inspectionIssue.update({
        where: { id: issueId },
        data: {
          approvalStatus: dto.approvalStatus,
          customerDecisionAt: new Date(),
          customerDecisionById: actor.actorId,
          customerDecisionByName: actor.actorName,
          customerDecisionNote: dto.note?.trim()
        }
      });

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: issue.report.bookingId,
          fromStatus: issue.report.booking.status,
          toStatus: issue.report.booking.status,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: `${dto.approvalStatus === IssueApprovalStatus.APPROVED ? 'Approved' : 'Rejected'} inspection issue: ${issue.title}`,
          metadata: {
            action: 'INSPECTION_ISSUE_DECISION',
            issueId,
            approvalStatus: dto.approvalStatus,
            severity: issue.severity
          }
        }
      });

      return tx.inspectionReport.findUniqueOrThrow({
        where: { id: issue.reportId },
        include: {
          issues: { orderBy: { createdAt: 'asc' } },
          booking: true
        }
      });
    });

    return this.toReportResponse(report);
  }

  async getApprovalStateForBooking(bookingId: string): Promise<InspectionApprovalSummaryDto | null> {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { bookingId },
      include: { issues: true, booking: true }
    });

    if (!report) {
      return null;
    }

    return this.toApprovalSummary(report.issues);
  }

  private toReportResponse(report: InspectionReportWithRelations): InspectionReportResponseDto {
    return {
      id: report.id,
      bookingId: report.bookingId,
      summary: report.summary,
      createdByType: report.createdByType,
      createdById: report.createdById,
      createdByName: report.createdByName,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      issues: report.issues.map((issue) => this.toIssueResponse(issue)),
      approvalSummary: this.toApprovalSummary(report.issues)
    };
  }

  private assertBookingAccess(customerId: string, user: AuthenticatedAppUser): void {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only access inspection data for your own booking.');
    }
  }

  private toIssueResponse(issue: {
    id: string;
    title: string;
    description: string | null;
    severity: any;
    estimatedPartsCost: Prisma.Decimal;
    estimatedLaborCost: Prisma.Decimal;
    imageUrls: Prisma.JsonValue | null;
    approvalStatus: any;
    customerDecisionAt: Date | null;
    customerDecisionById: string | null;
    customerDecisionByName: string | null;
    customerDecisionNote: string | null;
  }): InspectionIssueResponseDto {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      estimatedPartsCost: issue.estimatedPartsCost.toNumber(),
      estimatedLaborCost: issue.estimatedLaborCost.toNumber(),
      imageUrls: Array.isArray(issue.imageUrls) ? (issue.imageUrls as string[]) : [],
      approvalStatus: issue.approvalStatus,
      customerDecisionAt: issue.customerDecisionAt,
      customerDecisionById: issue.customerDecisionById,
      customerDecisionByName: issue.customerDecisionByName,
      customerDecisionNote: issue.customerDecisionNote
    };
  }

  private toApprovalSummary(
    issues: Array<{
      severity: any;
      approvalStatus: any;
    }>
  ): InspectionApprovalSummaryDto {
    const totalIssues = issues.length;
    const pendingIssues = issues.filter((issue) => issue.approvalStatus === IssueApprovalStatus.PENDING).length;
    const criticalIssues = issues.filter((issue) => issue.severity === 'CRITICAL').length;
    const criticalApproved = issues.filter(
      (issue) => issue.severity === 'CRITICAL' && issue.approvalStatus === IssueApprovalStatus.APPROVED
    ).length;
    const criticalRejected = issues.filter(
      (issue) => issue.severity === 'CRITICAL' && issue.approvalStatus === IssueApprovalStatus.REJECTED
    ).length;
    const approvalComplete = totalIssues > 0 && pendingIssues === 0;
    const allCriticalApproved = criticalIssues === criticalApproved;

    return {
      totalIssues,
      pendingIssues,
      criticalIssues,
      criticalApproved,
      criticalRejected,
      approvalComplete,
      allCriticalApproved,
      canStartService: approvalComplete && allCriticalApproved
    };
  }
}
