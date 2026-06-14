import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import { CentralizadoModule } from './modules/centralizado/centralizado.module';
import { AreasModule } from './modules/areas/areas.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocketModule } from './modules/socket/socket.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
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
    AreasModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    NotesModule,
    AuthModule,
    SocketModule,
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
