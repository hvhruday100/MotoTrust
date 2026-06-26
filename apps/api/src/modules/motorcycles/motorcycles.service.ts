import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { MotorcycleResponseDto } from './dto/motorcycle-response.dto';

@Injectable()
export class MotorcyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateMotorcycleDto, user: AuthenticatedAppUser): Promise<MotorcycleResponseDto> {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only add motorcycles to your own customer profile.');
    }

    const customer = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const registrationNumber = dto.registrationNumber.trim().toUpperCase();
    const existing = await this.prisma.motorcycle.findUnique({ where: { registrationNumber } });
    if (existing) {
      throw new ConflictException('A motorcycle with this registration number already exists.');
    }

    const motorcycle = await this.prisma.motorcycle.create({
      data: {
        customerId,
        registrationNumber,
        brand: dto.brand.trim(),
        model: dto.model.trim(),
        variant: dto.variant?.trim(),
        year: dto.year,
        odometerKm: dto.odometerKm
      }
    });

    return motorcycle;
  }

  async listByCustomer(customerId: string, user: AuthenticatedAppUser): Promise<MotorcycleResponseDto[]> {
    if (user.role === 'CUSTOMER' && user.customerProfileId !== customerId) {
      throw new ForbiddenException('You can only view motorcycles on your own customer profile.');
    }

    const customer = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.prisma.motorcycle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
