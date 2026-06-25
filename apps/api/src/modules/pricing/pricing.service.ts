import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ServicePackageResponseDto } from './dto/service-package-response.dto';

const DEFAULT_SERVICE_PACKAGES = [
  {
    code: 'ESSENTIAL_SERVICE',
    name: 'Essential Service',
    description: 'Oil check, chain lubrication, brakes inspection, lights check, and basic wash.',
    fixedPrice: new Prisma.Decimal(1299),
    estimatedMinutes: 120
  },
  {
    code: 'STANDARD_SERVICE',
    name: 'Standard Service',
    description: 'Essential service plus engine oil replacement, air filter cleaning, and battery check.',
    fixedPrice: new Prisma.Decimal(2199),
    estimatedMinutes: 180
  },
  {
    code: 'PREMIUM_SERVICE',
    name: 'Premium Service',
    description: 'Standard service plus detailed inspection, polish, and priority video proof package.',
    fixedPrice: new Prisma.Decimal(3499),
    estimatedMinutes: 240
  }
] as const;

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async listServicePackages(): Promise<ServicePackageResponseDto[]> {
    await this.ensureDefaultPackages();

    const packages = await this.prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { fixedPrice: 'asc' }
    });

    return packages.map((servicePackage) => ({
      id: servicePackage.id,
      code: servicePackage.code,
      name: servicePackage.name,
      description: servicePackage.description,
      fixedPrice: servicePackage.fixedPrice.toNumber(),
      estimatedMinutes: servicePackage.estimatedMinutes
    }));
  }

  async getDefaultServicePackageId(): Promise<string> {
    const packages = await this.listServicePackages();
    return packages[0].id;
  }

  private async ensureDefaultPackages(): Promise<void> {
    await Promise.all(
      DEFAULT_SERVICE_PACKAGES.map((servicePackage) =>
        this.prisma.servicePackage.upsert({
          where: { code: servicePackage.code },
          update: {
            name: servicePackage.name,
            description: servicePackage.description,
            fixedPrice: servicePackage.fixedPrice,
            estimatedMinutes: servicePackage.estimatedMinutes,
            isActive: true
          },
          create: servicePackage
        })
      )
    );
  }
}
