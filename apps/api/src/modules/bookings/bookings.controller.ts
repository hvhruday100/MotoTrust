import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a transparent fixed-price service booking.' })
  @ApiCreatedResponse({ type: ServiceBookingResponseDto })
  create(@Body() dto: CreateServiceBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get('customers/:customerId/bookings')
  @ApiOperation({ summary: 'List service bookings for a customer.' })
  @ApiOkResponse({ type: ServiceBookingResponseDto, isArray: true })
  listByCustomer(@Param('customerId') customerId: string) {
    return this.bookingsService.listByCustomer(customerId);
  }

  @Get('admin/bookings')
  @ApiOperation({ summary: 'Admin: list recent service bookings.' })
  @ApiOkResponse({ type: ServiceBookingResponseDto, isArray: true })
  listAll() {
    return this.bookingsService.listAll();
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Get booking details with lifecycle timeline.' })
  @ApiOkResponse({ type: BookingDetailResponseDto })
  findById(@Param('bookingId') bookingId: string) {
    return this.bookingsService.findById(bookingId);
  }

  @Patch('bookings/:bookingId/status')
  @ApiOperation({ summary: 'Move a booking to the next allowed lifecycle state and append audit history.' })
  @ApiOkResponse({ type: BookingDetailResponseDto })
  updateStatus(@Param('bookingId') bookingId: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(bookingId, dto);
  }
}
