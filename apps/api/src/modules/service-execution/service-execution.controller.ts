import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { AddServiceTaskPartDto } from './dto/add-service-task-part.dto';
import { ServiceExecutionResponseDto } from './dto/service-execution-response.dto';
import { ServiceTaskResponseDto } from './dto/service-task-response.dto';
import { UpdateServiceTaskDto } from './dto/update-service-task.dto';
import { ServiceExecutionService } from './service-execution.service';

@ApiTags('service-execution')
@Controller()
export class ServiceExecutionController {
  constructor(private readonly serviceExecutionService: ServiceExecutionService) {}

  @Get('bookings/:bookingId/service-execution')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get service task execution board for a booking.' })
  @ApiOkResponse({ type: ServiceExecutionResponseDto })
  getByBooking(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.serviceExecutionService.getByBookingId(bookingId, user);
  }

  @Get('mechanics/:mechanicId/service-tasks')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Get tasks assigned to a mechanic.' })
  @ApiOkResponse({ type: [ServiceTaskResponseDto] })
  getAssignedTasks(@Param('mechanicId') mechanicId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.serviceExecutionService.getAssignedTasks(mechanicId, user);
  }

  @Patch('service-tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Update assignment, notes, or status for a service task.' })
  @ApiOkResponse({ type: ServiceTaskResponseDto })
  updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateServiceTaskDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.serviceExecutionService.updateTask(taskId, dto, user);
  }

  @Post('service-tasks/:taskId/parts')
  @Roles(UserRole.ADMIN, UserRole.MECHANIC)
  @ApiOperation({ summary: 'Record part usage against a service task.' })
  @ApiCreatedResponse({ type: ServiceTaskResponseDto })
  addPartUsage(@Param('taskId') taskId: string, @Body() dto: AddServiceTaskPartDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.serviceExecutionService.addPartUsage(taskId, dto, user);
  }
}
