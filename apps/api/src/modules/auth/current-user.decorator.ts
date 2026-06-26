import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedAppUser } from './auth.types';

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedAppUser => {
  const request = context.switchToHttp().getRequest<{ user: AuthenticatedAppUser }>();
  return request.user;
});
