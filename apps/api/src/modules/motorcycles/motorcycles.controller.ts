import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { MotorcycleResponseDto } from './dto/motorcycle-response.dto';
import { MotorcyclesService } from './motorcycles.service';

@ApiTags('motorcycles')
@Controller('customers/:customerId/motorcycles')
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add motorcycle details for a registered customer.' })
  @ApiCreatedResponse({ type: MotorcycleResponseDto })
  create(@Param('customerId') customerId: string, @Body() dto: CreateMotorcycleDto, @CurrentUser() user: AuthenticatedAppUser) {
    return this.motorcyclesService.create(customerId, dto, user);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List motorcycles for a customer.' })
  @ApiOkResponse({ type: MotorcycleResponseDto, isArray: true })
  listByCustomer(@Param('customerId') customerId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.motorcyclesService.listByCustomer(customerId, user);
  }
}
