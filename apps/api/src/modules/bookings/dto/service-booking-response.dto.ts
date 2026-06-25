import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class ServiceBookingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  motorcycleId!: string;

  @ApiProperty()
  servicePackageId!: string;

  @ApiProperty()
  servicePackageName!: string;

  @ApiProperty({ example: 1299 })
  quotedPrice!: number;

  @ApiProperty({ enum: BookingStatus })
  status!: BookingStatus;

  @ApiProperty()
  preferredPickupAt!: Date;

  @ApiPropertyOptional()
  customerNotes?: string | null;

  @ApiProperty()
  createdAt!: Date;
}
