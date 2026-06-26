import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingActorType, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { getAllowedNextStatuses, isAllowedTransition } from './booking-status.transitions';
import { AddressInputDto } from './dto/address-input.dto';
import { BookingDetailResponseDto } from './dto/booking-detail-response.dto';
import { BookingTimelineEventResponseDto } from './dto/booking-timeline-event-response.dto';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ServiceBookingResponseDto } from './dto/service-booking-response.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingWithRelations } from './types/booking-with-relations.type';
import { ServiceExecutionService } from '../service-execution/service-execution.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly serviceExecutionService: ServiceExecutionService,
    private readonly authService: AuthService
  ) {}

  async create(dto: CreateServiceBookingDto, user: AuthenticatedAppUser): Promise<ServiceBookingResponseDto> {
    const customerId = user.customerProfileId;
    if (!customerId) {
      throw new BadRequestException('Customer profile onboarding is required before creating a booking.');
    }

    const customer = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const motorcycle = await this.prisma.motorcycle.findUnique({ where: { id: dto.motorcycleId } });
    if (!motorcycle || motorcycle.customerId !== customerId) {
      throw new BadRequestException('Motorcycle does not belong to the supplied customer.');
    }

    const servicePackageId = dto.servicePackageId ?? (await this.pricingService.getDefaultServicePackageId());
    const servicePackage = await this.prisma.servicePackage.findUnique({ where: { id: servicePackageId } });
    if (!servicePackage || !servicePackage.isActive) {
      throw new NotFoundException('Active service package not found.');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const pickupAddress = await tx.address.create({
        data: this.toAddressCreateInput(customerId, dto.pickupAddress)
      });
      const dropAddress = await tx.address.create({
        data: this.toAddressCreateInput(customerId, dto.dropAddress)
      });

      const actor = this.authService.toTimelineActor(user);

      return tx.booking.create({
        data: {
          customerId,
          motorcycleId: dto.motorcycleId,
          servicePackageId: servicePackage.id,
          pickupAddressId: pickupAddress.id,
          dropAddressId: dropAddress.id,
          preferredPickupAt: new Date(dto.preferredPickupAt),
          status: BookingStatus.CREATED,
          quotedPrice: servicePackage.fixedPrice,
          customerNotes: dto.customerNotes?.trim(),
          timelineEvents: {
            create: {
              toStatus: BookingStatus.CREATED,
              actorType: actor.actorType,
              actorId: actor.actorId,
              actorName: actor.actorName,
              note: 'Booking created by customer.'
            }
          }
        },
        include: {
          servicePackage: true,
          timelineEvents: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    return this.toResponse(booking as BookingWithRelations);
  }

  async listByCustomer(customerId: string, user: AuthenticatedAppUser): Promise<ServiceBookingResponseDto[]> {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only view your own bookings.');
    }

    const customer = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { customerId },
      include: {
        servicePackage: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map((booking) => this.toResponse(booking));
  }

  async listAll(): Promise<ServiceBookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      include: {
        servicePackage: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return bookings.map((booking) => this.toResponse(booking));
  }

  async findById(bookingId: string, user: AuthenticatedAppUser): Promise<BookingDetailResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        servicePackage: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    this.assertBookingAccess(booking.customerId, user);

    return this.toDetailResponse(booking);
  }

  async updateStatus(
    bookingId: string,
    dto: UpdateBookingStatusDto,
    user: AuthenticatedAppUser
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        servicePackage: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.status === dto.nextStatus) {
      throw new BadRequestException('Booking is already in the requested status.');
    }

    if (!isAllowedTransition(booking.status, dto.nextStatus)) {
      throw new BadRequestException({
        message: `Transition from ${booking.status} to ${dto.nextStatus} is not allowed.`,
        currentStatus: booking.status,
        requestedStatus: dto.nextStatus,
        allowedNextStatuses: getAllowedNextStatuses(booking.status)
      });
    }

    if (dto.nextStatus === BookingStatus.AWAITING_CUSTOMER_APPROVAL) {
      await this.assertInspectionReportExists(bookingId);
    }

    if (dto.nextStatus === BookingStatus.IN_SERVICE) {
      await this.assertBookingCanMoveToInService(bookingId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const actor = this.authService.toTimelineActor(user);

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: dto.nextStatus,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorName: actor.actorName,
          note: dto.note?.trim()
        }
      });

      if (dto.nextStatus === BookingStatus.IN_SERVICE) {
        await this.serviceExecutionService.initializeForBookingInService(tx, bookingId);
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: dto.nextStatus },
        include: {
          servicePackage: true,
          timelineEvents: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    return this.toDetailResponse(updated);
  }

  private toAddressCreateInput(customerId: string, address: AddressInputDto) {
    return {
      customerId,
      label: address.label.trim(),
      line1: address.line1.trim(),
      line2: address.line2?.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim()
    };
  }

  private async assertInspectionReportExists(bookingId: string): Promise<void> {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { bookingId },
      select: { id: true }
    });

    if (!report) {
      throw new BadRequestException('Inspection report is required before awaiting customer approval.');
    }
  }

  private async assertBookingCanMoveToInService(bookingId: string): Promise<void> {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { bookingId },
      include: { issues: true }
    });

    if (!report) {
      throw new BadRequestException('Inspection report is required before moving a booking to IN_SERVICE.');
    }

    if (!report.issues.length) {
      throw new BadRequestException('Inspection report must contain at least one issue before moving to IN_SERVICE.');
    }

    const pendingIssues = report.issues.filter((issue) => issue.approvalStatus === 'PENDING');
    if (pendingIssues.length > 0) {
      throw new BadRequestException('All inspection issues must be approved or rejected before moving to IN_SERVICE.');
    }

    const criticalNotApproved = report.issues.filter(
      (issue) => issue.severity === 'CRITICAL' && issue.approvalStatus !== 'APPROVED'
    );
    if (criticalNotApproved.length > 0) {
      throw new BadRequestException('All CRITICAL inspection items must be approved before moving to IN_SERVICE.');
    }
  }

  private assertBookingAccess(customerId: string, user: AuthenticatedAppUser): void {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only access your own bookings.');
    }
  }

  private toResponse(booking: BookingWithRelations): ServiceBookingResponseDto {
    return {
      id: booking.id,
      customerId: booking.customerId,
      motorcycleId: booking.motorcycleId,
      servicePackageId: booking.servicePackageId,
      servicePackageName: booking.servicePackage.name,
      quotedPrice: booking.quotedPrice.toNumber(),
      status: booking.status,
      preferredPickupAt: booking.preferredPickupAt,
      customerNotes: booking.customerNotes,
      createdAt: booking.createdAt
    };
  }

  private toDetailResponse(booking: BookingWithRelations): BookingDetailResponseDto {
    return {
      ...this.toResponse(booking),
      timeline: booking.timelineEvents.map((event) => this.toTimelineResponse(event))
    };
  }

  private toTimelineResponse(event: {
    id: string;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    actorType: BookingActorType;
    actorId: string | null;
    actorName: string;
    note: string | null;
    createdAt: Date;
  }): BookingTimelineEventResponseDto {
    return {
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorType: event.actorType,
      actorId: event.actorId,
      actorName: event.actorName,
      note: event.note,
      createdAt: event.createdAt
    };
  }
}
