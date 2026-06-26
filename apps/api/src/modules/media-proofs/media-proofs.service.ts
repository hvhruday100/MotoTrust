import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, MediaVisibility, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { BookingsService } from '../bookings/bookings.service';
import { BookingDetailResponseDto } from '../bookings/dto/booking-detail-response.dto';
import { InspectionsService } from '../inspections/inspections.service';
import { InspectionReportResponseDto } from '../inspections/dto/inspection-report-response.dto';
import { ServiceExecutionService } from '../service-execution/service-execution.service';
import { ServiceTaskResponseDto } from '../service-execution/dto/service-task-response.dto';
import { CreateProofMediaDto } from './dto/create-proof-media.dto';

@Injectable()
export class MediaProofsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly bookingsService: BookingsService,
    private readonly inspectionsService: InspectionsService,
    private readonly serviceExecutionService: ServiceExecutionService
  ) {}

  async addInspectionIssueMedia(
    issueId: string,
    dto: CreateProofMediaDto,
    user: AuthenticatedAppUser
  ): Promise<InspectionReportResponseDto> {
    this.assertStaffAccess(user);

    const issue = await this.prisma.inspectionIssue.findUnique({
      where: { id: issueId },
      include: {
        report: {
          include: {
            booking: true
          }
        }
      }
    });

    if (!issue) {
      throw new NotFoundException('Inspection issue not found.');
    }

    await this.createProofMedia(
      {
        bookingId: issue.report.bookingId,
        bookingStatus: issue.report.booking.status,
        inspectionIssueId: issue.id
      },
      dto,
      user,
      `Added inspection proof for "${issue.title}".`,
      {
        action: 'INSPECTION_MEDIA_UPLOADED',
        issueId: issue.id,
        issueTitle: issue.title,
        label: dto.label ?? null
      }
    );

    return this.inspectionsService.getReportByBookingId(issue.report.bookingId, user);
  }

  async addServiceTaskMedia(
    taskId: string,
    dto: CreateProofMediaDto,
    user: AuthenticatedAppUser
  ): Promise<ServiceTaskResponseDto> {
    this.assertStaffAccess(user);

    const task = await this.prisma.serviceTask.findUnique({
      where: { id: taskId },
      include: {
        serviceOrder: {
          include: {
            booking: true
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Service task not found.');
    }

    await this.createProofMedia(
      {
        bookingId: task.serviceOrder.bookingId,
        bookingStatus: task.serviceOrder.booking.status,
        serviceTaskId: task.id
      },
      dto,
      user,
      `Added ${dto.label?.toLowerCase() ?? 'service'} proof for task "${task.name}".`,
      {
        action: 'SERVICE_TASK_MEDIA_UPLOADED',
        taskId: task.id,
        taskName: task.name,
        label: dto.label ?? null
      }
    );

    return this.serviceExecutionService.getTaskById(task.id, user);
  }

  async addDeliveryProof(
    bookingId: string,
    dto: CreateProofMediaDto,
    user: AuthenticatedAppUser
  ): Promise<BookingDetailResponseDto> {
    this.assertStaffAccess(user);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, customerId: true, status: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    await this.createProofMedia(
      {
        bookingId,
        bookingStatus: booking.status
      },
      dto,
      user,
      'Added delivery proof media.',
      {
        action: 'DELIVERY_PROOF_UPLOADED',
        label: dto.label ?? null
      }
    );

    return this.bookingsService.findById(bookingId, user);
  }

  private assertStaffAccess(user: AuthenticatedAppUser): void {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MECHANIC) {
      throw new ForbiddenException('Only staff users can upload proof media.');
    }
  }

  private async createProofMedia(
    relationIds: {
      bookingId: string;
      bookingStatus: BookingStatus;
      inspectionIssueId?: string;
      serviceTaskId?: string;
    },
    dto: CreateProofMediaDto,
    user: AuthenticatedAppUser,
    note: string,
    metadata: Prisma.InputJsonValue
  ): Promise<void> {
    const actor = this.authService.toTimelineActor(user);
    const storageProvider = process.env.MEDIA_STORAGE_PROVIDER?.trim() || 'firebase-storage';

    await this.prisma.$transaction(async (tx) => {
      await tx.proofMediaAsset.create({
        data: {
          bookingId: relationIds.bookingId,
          inspectionIssueId: relationIds.inspectionIssueId,
          serviceTaskId: relationIds.serviceTaskId,
          uploadedById: user.id,
          type: dto.type,
          visibility: dto.visibility ?? MediaVisibility.CUSTOMER_VISIBLE,
          storageProvider,
          storageKey: dto.storageKey.trim(),
          storageUrl: dto.storageUrl.trim(),
          mimeType: dto.mimeType?.trim(),
          fileName: dto.fileName?.trim(),
          label: dto.label?.trim(),
          caption: dto.caption?.trim(),
          capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : undefined
        }
      });

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: relationIds.bookingId,
          fromStatus: relationIds.bookingStatus,
          toStatus: relationIds.bookingStatus,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note,
          metadata
        }
      });
    });
  }
}
