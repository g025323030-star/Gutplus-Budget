import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const decimalStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Must be a decimal with up to 2 fraction digits');

export const isoDateStringSchema = z.string().datetime({ offset: true });

export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParam = z.infer<typeof idParamSchema>;
