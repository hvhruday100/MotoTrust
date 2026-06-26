import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { BookingDetailResponseDto } from '../bookings/dto/booking-detail-response.dto';
import { InspectionReportResponseDto } from '../inspections/dto/inspection-report-response.dto';
import { ServiceTaskResponseDto } from '../service-execution/dto/service-task-response.dto';
import { CreateProofMediaDto } from './dto/create-proof-media.dto';
import { MediaProofsService } from './media-proofs.service';

@ApiTags('media-proofs')
@Controller()
export class MediaProofsController {
  constructor(private readonly mediaProofsService: MediaProofsService) {}

  @Post('inspection-issues/:issueId/media')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Attach inspection proof media to an inspection issue.' })
  @ApiCreatedResponse({ type: InspectionReportResponseDto })
  addInspectionIssueMedia(
    @Param('issueId') issueId: string,
    @Body() dto: CreateProofMediaDto,
    @CurrentUser() user: AuthenticatedAppUser
  ) {
    return this.mediaProofsService.addInspectionIssueMedia(issueId, dto, user);
  }

  @Post('service-tasks/:taskId/media')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Attach before/after or in-progress proof media to a service task.' })
  @ApiCreatedResponse({ type: ServiceTaskResponseDto })
  addServiceTaskMedia(
    @Param('taskId') taskId: string,
    @Body() dto: CreateProofMediaDto,
    @CurrentUser() user: AuthenticatedAppUser
  ) {
    return this.mediaProofsService.addServiceTaskMedia(taskId, dto, user);
  }

  @Post('bookings/:bookingId/delivery-proof')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Attach final delivery proof media to a booking.' })
  @ApiCreatedResponse({ type: BookingDetailResponseDto })
  addDeliveryProof(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateProofMediaDto,
    @CurrentUser() user: AuthenticatedAppUser
  ) {
    return this.mediaProofsService.addDeliveryProof(bookingId, dto, user);
  }
}
