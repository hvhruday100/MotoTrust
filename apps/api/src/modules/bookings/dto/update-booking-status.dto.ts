import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingActorType, BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  nextStatus!: BookingStatus;

  @ApiProperty({ enum: BookingActorType, example: BookingActorType.ADMIN })
  @IsEnum(BookingActorType)
  actorType!: BookingActorType;

  @ApiProperty({ example: 'Service Desk Admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  actorName!: string;

  @ApiPropertyOptional({ example: 'admin-user-id' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  actorId?: string;

  @ApiPropertyOptional({ example: 'Pickup partner assigned for tomorrow morning.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

