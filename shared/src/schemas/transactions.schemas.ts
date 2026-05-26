import { z } from 'zod';
import { CategoryFrequency, TransactionFrequency } from '../enums';
import { decimalStringSchema, isoDateStringSchema, uuidSchema } from './common.schemas';

const PLAIN_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const dateInputSchema = z
  .union([
    z.string().regex(PLAIN_DATE_REGEX, 'Invalid date'),
    z.string().datetime({ offset: true }),
    z.date(),
  ])
  .transform((value) => {
    if (value instanceof Date) return value.toISOString();
    if (PLAIN_DATE_REGEX.test(value)) {
      return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return value;
  });

export const transactionEntitySchema = z.object({
  id: uuidSchema,
  amount: decimalStringSchema,
  date: isoDateStringSchema,
  description: z.string().min(1),
  isCleared: z.boolean(),
  frequency: z.nativeEnum(CategoryFrequency),
  installmentsTotal: z.number().int().nullable(),
  installmentIndex: z.number().int().nullable(),
  installmentGroupId: uuidSchema.nullable(),
  householdId: uuidSchema,
  categoryId: uuidSchema.nullable(),
  accountId: uuidSchema.nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

const createTransactionBaseSchema = z.object({
  amount: decimalStringSchema,
  date: dateInputSchema,
  description: z.string().min(1),
  isCleared: z.boolean().optional(),
  frequency: z.nativeEnum(CategoryFrequency),
  installmentsTotal: z.number().int().min(2).max(120).optional(),
  installmentIndex: z.number().int().min(1).optional(),
  householdId: uuidSchema,
  categoryId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  isRecurring: z.boolean().optional(),
  endDate: dateInputSchema.optional(),
  recurringFrequency: z.nativeEnum(TransactionFrequency).optional(),
});

export const createTransactionSchema = createTransactionBaseSchema.superRefine(
  (value, ctx) => {
    const hasInstallments =
      value.installmentsTotal !== undefined && value.installmentsTotal !== null;
    const hasInstallmentIndex =
      value.installmentIndex !== undefined && value.installmentIndex !== null;

    if (hasInstallments && value.isRecurring === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A transaction cannot be both an installment plan and recurring',
        path: ['isRecurring'],
      });
    }

    if (value.isRecurring === true && value.recurringFrequency === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'frequency is required when isRecurring is true',
        path: ['recurringFrequency'],
      });
    }

    if (
      value.isRecurring === true &&
      value.recurringFrequency !== undefined &&
      value.recurringFrequency !== TransactionFrequency.MONTHLY &&
      value.recurringFrequency !== TransactionFrequency.BI_MONTHLY
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported recurring frequency',
        path: ['recurringFrequency'],
      });
    }

    if (hasInstallments !== hasInstallmentIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'installmentsTotal and installmentIndex must be provided together',
        path: hasInstallments ? ['installmentIndex'] : ['installmentsTotal'],
      });
    }

    if (
      hasInstallments &&
      hasInstallmentIndex &&
      (value.installmentIndex as number) > (value.installmentsTotal as number)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'installmentIndex cannot exceed installmentsTotal',
        path: ['installmentIndex'],
      });
    }

    if (value.endDate !== undefined && value.isRecurring !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate can only be provided when isRecurring is true',
        path: ['endDate'],
      });
    }

    if (value.endDate !== undefined) {
      const endMs = Date.parse(value.endDate);
      const startMs = Date.parse(value.date);
      if (!Number.isNaN(endMs) && !Number.isNaN(startMs) && endMs < startMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endDate cannot be earlier than date',
          path: ['endDate'],
        });
      }
    }
  },
);

export const updateTransactionSchema = createTransactionBaseSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
