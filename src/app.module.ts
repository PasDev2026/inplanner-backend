import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/envs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import { CentralizadoModule } from './app/centralizado/centralizado.module';
import { CentralizadoHttpModule } from './libs/centralizado-http/centralizado.module';
import { AreasModule } from './app/areas/areas.module';
import { UsersModule } from './app/users/users.module';
import { ProjectsModule } from './app/projects/projects.module';
import { TasksModule } from './app/tasks/tasks.module';
import { NotesModule } from './app/notes/notes.module';
import { AuthModule } from './app/auth/auth.module';
import { SocketModule } from './modules/socket/socket.module';
import { DashboardModule } from './app/dashboard/dashboard.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        schema: config.get('DB_SCHEMA') || 'inplanner',
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
          max: 20,
          idleTimeoutMillis: 30000,
          query_timeout: 10000,
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    CentralizadoModule,
    CentralizadoHttpModule,
    AreasModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    NotesModule,
    AuthModule,
    SocketModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
