import { z } from 'zod';

const envSchema = z
  .object({
    // Required
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1),
    FRONTEND_URL: z.string().url(),

    // Optional with defaults
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'lax']).default('lax'),
    DB_SCHEMA: z.string().default('inplanner'),
    SOCKET_INACTIVITY_TIMEOUT: z.coerce.number().default(28800000),

    // Future ML
    ML_API_URL: z.string().default('http://localhost:8000'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    PREDICTION_CACHE_TTL_SECONDS: z.coerce.number().default(600),
  })
  .passthrough();

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('Variables de entorno inválidas o faltantes:');
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      console.error(`  - ${path}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export type Env = z.infer<typeof envSchema>;
