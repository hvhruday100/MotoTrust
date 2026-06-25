import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingActorType, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { getAllowedNextStatuses, isAllowedTransition } from './booking-status.transitions';
import { AddressInputDto } from './dto/address-input.dto';
import { BookingDetailResponseDto } from './dto/booking-detail-response.dto';
import { BookingTimelineEventResponseDto } from './dto/booking-timeline-event-response.dto';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ServiceBookingResponseDto } from './dto/service-booking-response.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingWithRelations } from './types/booking-with-relations.type';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService
  ) {}

  async create(dto: CreateServiceBookingDto): Promise<ServiceBookingResponseDto> {
    const customer = await this.prisma.customerProfile.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const motorcycle = await this.prisma.motorcycle.findUnique({ where: { id: dto.motorcycleId } });
    if (!motorcycle || motorcycle.customerId !== dto.customerId) {
      throw new BadRequestException('Motorcycle does not belong to the supplied customer.');
    }

    const servicePackageId = dto.servicePackageId ?? (await this.pricingService.getDefaultServicePackageId());
    const servicePackage = await this.prisma.servicePackage.findUnique({ where: { id: servicePackageId } });
    if (!servicePackage || !servicePackage.isActive) {
      throw new NotFoundException('Active service package not found.');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const pickupAddress = await tx.address.create({
        data: this.toAddressCreateInput(dto.customerId, dto.pickupAddress)
      });
      const dropAddress = await tx.address.create({
        data: this.toAddressCreateInput(dto.customerId, dto.dropAddress)
      });

      return tx.booking.create({
        data: {
          customerId: dto.customerId,
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
              actorType: BookingActorType.CUSTOMER,
              actorName: 'Customer',
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

    return this.toResponse(booking);
  }

  async listByCustomer(customerId: string): Promise<ServiceBookingResponseDto[]> {
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

  async findById(bookingId: string): Promise<BookingDetailResponseDto> {
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

    return this.toDetailResponse(booking);
  }

  async updateStatus(bookingId: string, dto: UpdateBookingStatusDto): Promise<BookingDetailResponseDto> {
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

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.bookingTimelineEvent.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: dto.nextStatus,
          actorType: dto.actorType,
          actorId: dto.actorId?.trim(),
          actorName: dto.actorName.trim(),
          note: dto.note?.trim()
        }
      });

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
