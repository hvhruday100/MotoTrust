import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a customer with mocked Firebase identity support.' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  register(@Body() dto: RegisterCustomerDto) {
    return this.customersService.register(dto);
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Get a customer profile.' })
  @ApiOkResponse({ type: CustomerResponseDto })
  findById(@Param('customerId') customerId: string) {
    return this.customersService.findById(customerId);
  }
}

