import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ServicePackageResponseDto } from './dto/service-package-response.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('service-packages')
  @Public()
  @ApiOperation({ summary: 'List transparent fixed-price service packages.' })
  @ApiOkResponse({ type: ServicePackageResponseDto, isArray: true })
  listServicePackages() {
    return this.pricingService.listServicePackages();
  }
}
