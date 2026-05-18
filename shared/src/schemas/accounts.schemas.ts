import { z } from 'zod';
import { AccountType } from '../enums';
import { decimalStringSchema, uuidSchema } from './common.schemas';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(AccountType),
  balance: decimalStringSchema.optional(),
  currency: z.string().length(3).optional(),
  monthlyPayment: decimalStringSchema.optional(),
  interestRate: decimalStringSchema.optional(),
  urgencyLevel: z.number().int(),
  householdId: uuidSchema,
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
