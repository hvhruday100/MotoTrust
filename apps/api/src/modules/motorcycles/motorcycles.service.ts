import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { MotorcycleResponseDto } from './dto/motorcycle-response.dto';

@Injectable()
export class MotorcyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateMotorcycleDto): Promise<MotorcycleResponseDto> {
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

  async listByCustomer(customerId: string): Promise<MotorcycleResponseDto[]> {
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

