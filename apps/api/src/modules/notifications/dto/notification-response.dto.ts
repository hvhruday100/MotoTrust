import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  category!: string;

  @ApiPropertyOptional()
  bookingId?: string | null;

  @ApiPropertyOptional()
  actionUrl?: string | null;

  @ApiPropertyOptional()
  readAt?: Date | null;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
