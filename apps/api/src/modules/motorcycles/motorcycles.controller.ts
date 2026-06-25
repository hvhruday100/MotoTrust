import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { MotorcycleResponseDto } from './dto/motorcycle-response.dto';
import { MotorcyclesService } from './motorcycles.service';

@ApiTags('motorcycles')
@Controller('customers/:customerId/motorcycles')
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) {}

  @Post()
  @ApiOperation({ summary: 'Add motorcycle details for a registered customer.' })
  @ApiCreatedResponse({ type: MotorcycleResponseDto })
  create(@Param('customerId') customerId: string, @Body() dto: CreateMotorcycleDto) {
    return this.motorcyclesService.create(customerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List motorcycles for a customer.' })
  @ApiOkResponse({ type: MotorcycleResponseDto, isArray: true })
  listByCustomer(@Param('customerId') customerId: string) {
    return this.motorcyclesService.listByCustomer(customerId);
  }
}

