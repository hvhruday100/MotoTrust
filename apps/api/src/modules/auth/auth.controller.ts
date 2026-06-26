import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from './current-user.decorator';
import { AuthService } from './auth.service';
import { BootstrapRoleDto } from './dto/bootstrap-role.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { AuthenticatedAppUser } from './auth.types';
import { RegisterCustomerDto } from '../customers/dto/register-customer.dto';
import { CustomersService } from '../customers/customers.service';
import { CustomerResponseDto } from '../customers/dto/customer-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customersService: CustomersService
  ) {}

  @Post('session')
  @ApiOperation({ summary: 'Verify Firebase ID token, sync user mapping, and return current MotoTrust session user.' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  createSession(@CurrentUser() user: AuthenticatedAppUser) {
    return user;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated MotoTrust user and role mapping.' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  me(@CurrentUser() user: AuthenticatedAppUser) {
    return user;
  }

  @Post('onboard/customer')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create or update the authenticated customer profile after Firebase signup.' })
  @ApiOkResponse({ type: CustomerResponseDto })
  onboardCustomer(@CurrentUser() user: AuthenticatedAppUser, @Body() dto: RegisterCustomerDto) {
    return this.customersService.register(user, dto);
  }

  @Post('bootstrap/assign-role')
  @Public()
  @ApiOperation({ summary: 'Bootstrap an ADMIN or MECHANIC role for an existing Firebase-authenticated MotoTrust user.' })
  @ApiHeader({ name: 'x-mototrust-bootstrap-key', required: true })
  @ApiBody({ type: BootstrapRoleDto })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  bootstrapRole(@Body() dto: BootstrapRoleDto, @Headers('x-mototrust-bootstrap-key') bootstrapKey?: string) {
    return this.authService.bootstrapRole(dto, bootstrapKey);
  }
}
