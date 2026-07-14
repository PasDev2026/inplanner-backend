import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { JsonLogger } from './common/logger/json-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const startTime = Date.now();
  logger.log('[TIMER] Inicio del bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  logger.log(
    `[TIMER] NestFactory.create (TypeORM + modules + DB): ${Date.now() - startTime}ms`,
  );
  app.use(express.json({ limit: '1mb' }));
  app.useLogger(new JsonLogger());

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new BigIntInterceptor(),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  logger.log(
    `[TIMER] Middlewares + Pipes + Interceptors: ${Date.now() - startTime}ms`,
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
  logger.log(`[TIMER] Swagger createDocument: ${Date.now() - startTime}ms`);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') as number;
  await app.listen(port);
  logger.log(`[TIMER] app.listen: ${Date.now() - startTime}ms`);
  logger.log(`Servidor corriendo en puerto ${port}`);
}
void bootstrap();
