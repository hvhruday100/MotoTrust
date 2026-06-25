import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get service task execution board for a booking.' })
  @ApiOkResponse({ type: ServiceExecutionResponseDto })
  getByBooking(@Param('bookingId') bookingId: string) {
    return this.serviceExecutionService.getByBookingId(bookingId);
  }

  @Get('mechanics/:mechanicId/service-tasks')
  @ApiOperation({ summary: 'Get tasks assigned to a mechanic.' })
  @ApiOkResponse({ type: [ServiceTaskResponseDto] })
  getAssignedTasks(@Param('mechanicId') mechanicId: string) {
    return this.serviceExecutionService.getAssignedTasks(mechanicId);
  }

  @Patch('service-tasks/:taskId')
  @ApiOperation({ summary: 'Update assignment, notes, or status for a service task.' })
  @ApiOkResponse({ type: ServiceTaskResponseDto })
  updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateServiceTaskDto) {
    return this.serviceExecutionService.updateTask(taskId, dto);
  }

  @Post('service-tasks/:taskId/parts')
  @ApiOperation({ summary: 'Record part usage against a service task.' })
  @ApiCreatedResponse({ type: ServiceTaskResponseDto })
  addPartUsage(@Param('taskId') taskId: string, @Body() dto: AddServiceTaskPartDto) {
    return this.serviceExecutionService.addPartUsage(taskId, dto);
  }
}
