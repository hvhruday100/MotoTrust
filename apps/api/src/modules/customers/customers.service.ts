import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MockIdentityProviderService } from '../auth/mock-identity-provider.service';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identityProvider: MockIdentityProviderService
  ) {}

  async register(dto: RegisterCustomerDto): Promise<CustomerResponseDto> {
    if (!dto.email && !dto.phone) {
      throw new ConflictException('Either email or phone is required to register a customer.');
    }

    const firebaseUid = this.identityProvider.resolveCustomerUid(dto);
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          ...(dto.email ? [{ email: dto.email.toLowerCase() }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : [])
        ]
      },
      include: { customerProfile: true }
    });

    if (existing?.customerProfile) {
      return this.toResponse(existing.customerProfile, existing.email, existing.phone);
    }

    const customer = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firebaseUid,
          email: dto.email?.toLowerCase(),
          phone: dto.phone,
          role: UserRole.CUSTOMER
        }
      });

      const profile = await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName: dto.fullName.trim()
        }
      });

      return { profile, user };
    });

    return this.toResponse(customer.profile, customer.user.email, customer.user.phone);
  }

  async findById(customerId: string): Promise<CustomerResponseDto> {
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
