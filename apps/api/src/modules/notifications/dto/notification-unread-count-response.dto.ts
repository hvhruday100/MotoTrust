import { ApiProperty } from '@nestjs/swagger';

export class NotificationUnreadCountResponseDto {
  @ApiProperty()
  unreadCount!: number;
}
