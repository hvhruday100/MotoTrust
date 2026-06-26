import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
    const header = request.headers.authorization ?? request.headers.Authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      throw new UnauthorizedException('Authorization Bearer token is required.');
    }

    const identity = await this.firebaseAdminService.verifyIdToken(token);
    request.user = await this.authService.syncUser(identity);
    return true;
  }
}
