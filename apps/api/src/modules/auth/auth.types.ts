import { UserRole } from '@prisma/client';

export type AuthenticatedAppUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  role: UserRole;
  customerProfileId: string | null;
};

export type FirebaseIdentity = {
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
};
