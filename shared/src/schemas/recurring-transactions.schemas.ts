import { z } from 'zod';
import { TransactionFrequency } from '../enums';
import { uuidSchema } from './common.schemas';

export const recurringTransactionSchema = z.object({
  id: uuidSchema,
  householdId: uuidSchema,
  categoryId: uuidSchema,
  accountId: uuidSchema,
  amount: z.number(),
  description: z.string().min(1),
  dayOfMonth: z.number().int().min(1).max(31),
  frequency: z.nativeEnum(TransactionFrequency),
  startDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createRecurringTransactionSchema = z.object({
  householdId: uuidSchema,
  categoryId: uuidSchema,
  accountId: uuidSchema,
  amount: z.number(),
  description: z.string().min(1),
  frequency: z.nativeEnum(TransactionFrequency),
  startDate: z.coerce.date(),
});

export type RecurringTransactionEntity = z.infer<typeof recurringTransactionSchema>;
export type CreateRecurringTransactionInput = z.infer<
  typeof createRecurringTransactionSchema
>;
