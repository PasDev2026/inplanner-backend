import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { AppModule } from './app.module';
import { JsonLogger } from './common/logger/json-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const envSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
    JWT_SECRET: z
      .string()
      .min(10, 'JWT_SECRET debe tener al menos 10 caracteres'),
    FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida'),
  });

  const envResult = envSchema.safeParse(process.env);
  if (!envResult.success) {
    logger.error('Variables de entorno inválidas o faltantes:');
    const fieldErrors = envResult.error.flatten().fieldErrors;
    for (const [key, errors] of Object.entries(fieldErrors)) {
      logger.error(`  ${key}: ${errors?.join(', ')}`);
    }
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.use(express.json({ limit: '1mb' }));
  app.useLogger(new JsonLogger());

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new BigIntInterceptor(),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inplanner API')
    .setDescription('API de gestión de proyectos Inplanner')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT de acceso',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Servidor corriendo en puerto ${port}`);
}
void bootstrap();
