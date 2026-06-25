import { Module } from '@nestjs/common';
import { MockIdentityProviderService } from './mock-identity-provider.service';

@Module({
  providers: [MockIdentityProviderService],
  exports: [MockIdentityProviderService]
})
export class AuthModule {}

