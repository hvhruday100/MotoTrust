import { Injectable } from '@nestjs/common';

type ResolveIdentityInput = {
  firebaseUid?: string;
  email?: string;
  phone?: string;
};

@Injectable()
export class MockIdentityProviderService {
  resolveCustomerUid(input: ResolveIdentityInput): string {
    if (input.firebaseUid) {
      return input.firebaseUid;
    }

    const stableIdentifier = input.email ?? input.phone;
    if (!stableIdentifier) {
      return `mock:anonymous:${crypto.randomUUID()}`;
    }

    return `mock:customer:${stableIdentifier.trim().toLowerCase()}`;
  }
}

