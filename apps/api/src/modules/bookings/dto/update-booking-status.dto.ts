import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  nextStatus!: BookingStatus;

  @ApiPropertyOptional({ example: 'Pickup partner assigned for tomorrow morning.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
