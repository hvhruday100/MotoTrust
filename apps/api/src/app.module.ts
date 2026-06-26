import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { MediaProofsModule } from './modules/media-proofs/media-proofs.module';
import { MotorcyclesModule } from './modules/motorcycles/motorcycles.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ServiceExecutionModule } from './modules/service-execution/service-execution.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    CustomersModule,
    MotorcyclesModule,
    PricingModule,
    BookingsModule,
    InspectionsModule,
    MediaProofsModule,
    NotificationsModule,
    ServiceExecutionModule
  ]
})
export class AppModule {}
