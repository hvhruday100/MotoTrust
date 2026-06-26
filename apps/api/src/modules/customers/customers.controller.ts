import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('register')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create or update the authenticated customer profile.' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  register(@CurrentUser() user: AuthenticatedAppUser, @Body() dto: RegisterCustomerDto) {
    return this.customersService.register(user, dto);
  }

  @Get(':customerId')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a customer profile.' })
  @ApiOkResponse({ type: CustomerResponseDto })
  findById(@Param('customerId') customerId: string, @CurrentUser() user: AuthenticatedAppUser) {
    return this.customersService.findById(customerId, user);
  }
}
