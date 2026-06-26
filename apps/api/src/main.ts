import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.enableCors({
    origin: process.env.WEB_APP_URL?.split(',') ?? ['http://localhost:3000'],
    credentials: true
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MotoTrust API')
    .setDescription('APIs for transparent motorcycle service booking, proof, and digital service history.')
    .setVersion('0.1.0')
    .addTag('customers')
    .addTag('motorcycles')
    .addTag('pricing')
    .addTag('auth')
    .addTag('bookings')
    .addTag('inspections')
    .addTag('service-execution')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
