import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { BookingsService } from './bookings.service';
import { BookingDetailResponseDto } from './dto/booking-detail-response.dto';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ServiceBookingResponseDto } from './dto/service-booking-response.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a transparent fixed-price service booking.' })
  @ApiCreatedResponse({ type: ServiceBookingResponseDto })
  create(@Body() dto: CreateServiceBookingDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.bookingsService.create(dto, user);
  }

  @Get('customers/:customerId/bookings')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List service bookings for a customer.' })
  @ApiOkResponse({ type: ServiceBookingResponseDto, isArray: true })
  listByCustomer(@Param('customerId') customerId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.bookingsService.listByCustomer(customerId, user);
  }

  @Get('admin/bookings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: list recent service bookings.' })
  @ApiOkResponse({ type: ServiceBookingResponseDto, isArray: true })
  listAll() {
    return this.bookingsService.listAll();
  }

  @Get('bookings/:bookingId')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Get booking details with lifecycle timeline.' })
  @ApiOkResponse({ type: BookingDetailResponseDto })
  findById(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.bookingsService.findById(bookingId, user);
  }

  @Patch('bookings/:bookingId/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Move a booking to the next allowed lifecycle state and append audit history.' })
  @ApiOkResponse({ type: BookingDetailResponseDto })
  updateStatus(@Param('bookingId') bookingId: string, @Body() dto: UpdateBookingStatusDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.bookingsService.updateStatus(bookingId, dto, user);
  }
}
