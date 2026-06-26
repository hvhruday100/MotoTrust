import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CustomersModule } from '../customers/customers.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [CustomersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAdminService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ],
  exports: [AuthService]
})
export class AuthModule {}
