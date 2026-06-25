import { ApiProperty } from '@nestjs/swagger';
import { ServiceBookingResponseDto } from './service-booking-response.dto';
import { BookingTimelineEventResponseDto } from './booking-timeline-event-response.dto';

export class BookingDetailResponseDto extends ServiceBookingResponseDto {
  @ApiProperty({ type: BookingTimelineEventResponseDto, isArray: true })
  timeline!: BookingTimelineEventResponseDto[];
}

