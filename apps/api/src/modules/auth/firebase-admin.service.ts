import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { FirebaseIdentity } from './auth.types';

@Injectable()
export class FirebaseAdminService {
  private app: App | null = null;

  async verifyIdToken(token: string): Promise<FirebaseIdentity> {
    if (!token?.trim()) {
      throw new UnauthorizedException('Firebase ID token is required.');
    }

    try {
      const decoded = await this.getAuth().verifyIdToken(token);
      return this.toIdentity(decoded);
    } catch {
      throw new UnauthorizedException('Firebase ID token is invalid or expired.');
    }
  }

  private getAuth(): Auth {
    if (!this.app) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        throw new InternalServerErrorException(
          'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
        );
      }

      this.app =
        getApps().find((app) => app.name === 'mototrust-api') ??
        initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey
            })
          },
          'mototrust-api'
        );
    }

    return getAuth(this.app);
  }

  private toIdentity(decoded: DecodedIdToken): FirebaseIdentity {
    return {
      firebaseUid: decoded.uid,
      email: decoded.email?.toLowerCase() ?? null,
      phone: decoded.phone_number ?? null,
      displayName: typeof decoded.name === 'string' ? decoded.name : decoded.email ?? decoded.uid
    };
  }
}
