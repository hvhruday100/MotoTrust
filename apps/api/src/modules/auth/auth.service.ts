import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BookingActorType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BootstrapRoleDto } from './dto/bootstrap-role.dto';
import { AuthenticatedAppUser, FirebaseIdentity } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(identity: FirebaseIdentity): Promise<AuthenticatedAppUser> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: identity.firebaseUid },
          ...(identity.email ? [{ email: identity.email }] : [])
        ]
      },
      include: { customerProfile: true }
    });

    if (!existing) {
      const created = await this.prisma.user.create({
        data: {
          firebaseUid: identity.firebaseUid,
          email: identity.email,
          phone: identity.phone,
          displayName: identity.displayName,
          role: UserRole.CUSTOMER,
          lastLoginAt: new Date()
        },
        include: { customerProfile: true }
      });

      return this.toAuthenticatedUser(created);
    }

    const updated = await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        firebaseUid: identity.firebaseUid,
        email: identity.email ?? existing.email,
        phone: identity.phone ?? existing.phone,
        displayName: identity.displayName ?? existing.displayName,
        lastLoginAt: new Date()
      },
      include: { customerProfile: true }
    });

    return this.toAuthenticatedUser(updated);
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedAppUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Authenticated MotoTrust user is not active.');
    }

    return this.toAuthenticatedUser(user);
  }

  async bootstrapRole(dto: BootstrapRoleDto, bootstrapKey: string | undefined): Promise<AuthenticatedAppUser> {
    if (!process.env.AUTH_BOOTSTRAP_KEY || bootstrapKey !== process.env.AUTH_BOOTSTRAP_KEY) {
      throw new UnauthorizedException('Bootstrap key is invalid.');
    }

    if (dto.role !== UserRole.ADMIN && dto.role !== UserRole.MECHANIC) {
      throw new UnauthorizedException('Bootstrap role assignment only supports ADMIN or MECHANIC.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { customerProfile: true }
    });

    if (!user) {
      throw new NotFoundException('No MotoTrust user exists for the supplied email.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { role: dto.role },
      include: { customerProfile: true }
    });

    return this.toAuthenticatedUser(updated);
  }

  toTimelineActor(user: AuthenticatedAppUser): {
    actorType: BookingActorType;
    actorId: string;
    actorName: string;
  } {
    return {
      actorType: this.toBookingActorType(user.role),
      actorId: user.id,
      actorName: this.getDisplayName(user)
    };
  }

  getDisplayName(user: Pick<AuthenticatedAppUser, 'displayName' | 'email' | 'firebaseUid'>): string {
    return user.displayName ?? user.email ?? user.firebaseUid;
  }

  private toBookingActorType(role: UserRole): BookingActorType {
    switch (role) {
      case UserRole.ADMIN:
        return BookingActorType.ADMIN;
      case UserRole.MECHANIC:
        return BookingActorType.MECHANIC;
      default:
        return BookingActorType.CUSTOMER;
    }
  }

  private toAuthenticatedUser(
    user: Prisma.UserGetPayload<{
      include: {
        customerProfile: true;
      };
    }>
  ): AuthenticatedAppUser {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName ?? user.customerProfile?.fullName ?? user.email,
      role: user.role,
      customerProfileId: user.customerProfile?.id ?? null
    };
  }
}
