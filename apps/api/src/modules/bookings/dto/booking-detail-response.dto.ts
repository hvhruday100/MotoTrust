import { ApiProperty } from '@nestjs/swagger';
import { ProofMediaResponseDto } from '../../media-proofs/dto/proof-media-response.dto';
import { ServiceBookingResponseDto } from './service-booking-response.dto';
import { BookingTimelineEventResponseDto } from './booking-timeline-event-response.dto';

export class BookingDetailResponseDto extends ServiceBookingResponseDto {
  @ApiProperty({ type: BookingTimelineEventResponseDto, isArray: true })
  timeline!: BookingTimelineEventResponseDto[];

  @ApiProperty({ type: [ProofMediaResponseDto] })
  mediaTimeline!: ProofMediaResponseDto[];
}
