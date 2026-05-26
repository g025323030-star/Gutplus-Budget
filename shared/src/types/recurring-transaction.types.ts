import type { TransactionFrequency } from '../enums';

export interface RecurringTransaction {
  id: string;
  householdId: string;
  categoryId: string;
  accountId: string;
  amount: number;
  description: string;
  dayOfMonth: number;
  frequency: TransactionFrequency;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
