import { z } from 'zod';

/** Paginación común a las tools que listan colecciones. */
export const paginationShape = {
  page: z.number().int().min(1).default(1).describe('Número de página'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Cantidad máxima de registros (1-100)'),
};
