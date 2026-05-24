import { z } from 'zod';
import { CategoryFrequency } from '../enums';
import { decimalStringSchema, isoDateStringSchema, uuidSchema } from './common.schemas';

export const createTransactionSchema = z.object({
  amount: decimalStringSchema,
  date: isoDateStringSchema,
  description: z.string().min(1),
  isCleared: z.boolean().optional(),
  frequency: z.nativeEnum(CategoryFrequency),
  installmentsTotal: z.number().int().min(2).max(120).optional(),
  householdId: uuidSchema,
  categoryId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
