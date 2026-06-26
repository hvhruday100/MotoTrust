import { ConflictException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { FirebaseIdentity } from './auth.types';

type MockUserRecord = Prisma.UserGetPayload<{
  include: {
    customerProfile: true;
  };
}>;

function createUniqueConstraintError(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
    code: 'P2002',
    clientVersion: '5.22.0',
    meta: { target }
  });
}

function createUserRecord(identity: FirebaseIdentity): MockUserRecord {
  return {
    id: 'user_123',
    firebaseUid: identity.firebaseUid,
    email: identity.email,
    phone: identity.phone,
    displayName: identity.displayName,
    role: UserRole.CUSTOMER,
    isActive: true,
    lastLoginAt: new Date('2026-06-26T00:00:00.000Z'),
    createdAt: new Date('2026-06-26T00:00:00.000Z'),
    updatedAt: new Date('2026-06-26T00:00:00.000Z'),
    customerProfile: null
  };
}

describe('AuthService.syncUser', () => {
  const identity: FirebaseIdentity = {
    firebaseUid: 'firebase_uid_123',
    email: 'customer@example.com',
    phone: null,
    displayName: 'Customer Example'
  };

  it('keeps concurrent first-login requests idempotent when firebaseUid upserts race', async () => {
    const persistedUser = createUserRecord(identity);
    let created = false;

    const prisma = {
      user: {
        upsert: jest.fn(async () => {
          if (!created) {
            created = true;
            return persistedUser;
          }

          throw createUniqueConstraintError(['firebaseUid']);
        }),
        findUnique: jest.fn(async ({ where }: { where: { firebaseUid?: string; email?: string } }) => {
          if (where.firebaseUid === identity.firebaseUid) {
            return persistedUser;
          }

          if (where.email === identity.email) {
            return persistedUser;
          }

          return null;
        }),
        update: jest.fn(async ({ data }: { data: Partial<MockUserRecord> }) => ({
          ...persistedUser,
          ...data
        }))
      }
    };

    const service = new AuthService(prisma as never);
    const results = await Promise.all(Array.from({ length: 5 }, () => service.syncUser(identity)));

    expect(results).toHaveLength(5);
    expect(results.every((result) => result.id === persistedUser.id)).toBe(true);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(5);
    expect(prisma.user.update).toHaveBeenCalledTimes(4);
  });

  it('returns 409 when a different MotoTrust user already owns the email', async () => {
    const prisma = {
      user: {
        upsert: jest.fn(async () => {
          throw createUniqueConstraintError(['email']);
        }),
        findUnique: jest.fn(async ({ where }: { where: { firebaseUid?: string; email?: string } }) => {
          if (where.firebaseUid === identity.firebaseUid) {
            return null;
          }

          if (where.email === identity.email) {
            return createUserRecord({
              ...identity,
              firebaseUid: 'another_firebase_uid'
            });
          }

          return null;
        }),
        update: jest.fn()
      }
    };

    const service = new AuthService(prisma as never);

    await expect(service.syncUser(identity)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
