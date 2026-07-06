import { config as dotenvConfig } from 'dotenv';
import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DB_SCHEMA } from './schema';

dotenvConfig();

const config = {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  schema: DB_SCHEMA,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
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
};

export const dataSourceOptions = config as DataSourceOptions;
export default registerAs('database', () => config);
export const connectionSource = new DataSource(dataSourceOptions);
