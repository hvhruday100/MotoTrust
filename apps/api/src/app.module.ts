import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { MotorcyclesModule } from './modules/motorcycles/motorcycles.module';
import { PricingModule } from './modules/pricing/pricing.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, CustomersModule, MotorcyclesModule, PricingModule, BookingsModule]
})
export class AppModule {}
