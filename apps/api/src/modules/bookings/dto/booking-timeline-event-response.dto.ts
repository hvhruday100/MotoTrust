import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingActorType, BookingStatus } from '@prisma/client';

export class BookingTimelineEventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  fromStatus?: BookingStatus | null;

  @ApiProperty({ enum: BookingStatus })
  toStatus!: BookingStatus;

  @ApiProperty({ enum: BookingActorType })
  actorType!: BookingActorType;

  @ApiPropertyOptional()
  actorId?: string | null;

  @ApiProperty()
  actorName!: string;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

