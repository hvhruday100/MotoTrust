import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationUnreadCountResponseDto } from './dto/notification-unread-count-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for the authenticated user.' })
  @ApiOkResponse({ type: [NotificationResponseDto] })
  list(@CurrentUser() user: AuthenticatedAppUser) {
    return this.notificationsService.listForUser(user);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the unread notification count for the authenticated user.' })
  @ApiOkResponse({ type: NotificationUnreadCountResponseDto })
  unreadCount(@CurrentUser() user: AuthenticatedAppUser) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark one in-app notification as read.' })
  @ApiOkResponse({ type: NotificationResponseDto })
  markAsRead(@Param('notificationId') notificationId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.notificationsService.markAsRead(notificationId, user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all in-app notifications as read.' })
  @ApiOkResponse({ type: NotificationUnreadCountResponseDto })
  markAllAsRead(@CurrentUser() user: AuthenticatedAppUser) {
    return this.notificationsService.markAllAsRead(user);
  }
}
