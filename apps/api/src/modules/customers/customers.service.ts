import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedAppUser } from '../auth/auth.types';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(user: AuthenticatedAppUser, dto: RegisterCustomerDto): Promise<CustomerResponseDto> {
    const email = dto.email?.toLowerCase() ?? user.email ?? undefined;
    const phone = dto.phone ?? user.phone ?? undefined;
    const customerProfileId = user.customerProfileId;

    if (!email && !phone) {
      throw new ConflictException('Either email or phone is required to register a customer.');
    }

    if (customerProfileId) {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            email: email ?? user.email,
            phone: phone ?? user.phone,
            displayName: dto.fullName.trim()
          }
        });

        const profile = await tx.customerProfile.update({
          where: { id: customerProfileId },
          data: { fullName: dto.fullName.trim() },
          include: { user: true }
        });
        return profile;
      });

      return this.toResponse(updated, updated.user.email, updated.user.phone);
    }

    const conflict = await this.prisma.customerProfile.findFirst({
      where: {
        userId: {
          not: user.id
        },
        user: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        }
      }
    });

    if (conflict) {
      throw new ConflictException('A customer profile already exists for the supplied email or phone.');
    }

    const customer = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          email,
          phone,
          displayName: dto.fullName.trim()
        }
      });

      const profile = await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName: dto.fullName.trim()
        }
      });

      return { profile, user: updatedUser };
    });

    return this.toResponse(customer.profile, customer.user.email, customer.user.phone);
  }

  async findById(customerId: string, user: AuthenticatedAppUser): Promise<CustomerResponseDto> {
    if (user.customerProfileId !== customerId && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only access your own customer profile.');
    }

    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: true }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.toResponse(customer, customer.user.email, customer.user.phone);
  }

  private toResponse(
    customer: { id: string; userId: string; fullName: string; createdAt: Date },
    email?: string | null,
    phone?: string | null
  ): CustomerResponseDto {
    return {
      id: customer.id,
      userId: customer.userId,
      fullName: customer.fullName,
      email,
      phone,
      createdAt: customer.createdAt
    };
  }
}
