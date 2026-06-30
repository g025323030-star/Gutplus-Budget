import type { CurrencyCode, TransactionFrequency } from '@gutplus/shared';
import type { RowStatus } from './SaveIndicator';

export type DraftRowMode = 'none' | 'installments' | 'recurring' | 'lastMonth';

export interface DraftRowSnapshot {
  description: string;
  categoryId: string | null;
  amount: string;
  needsReview: boolean;
  targetAmount: string | null;
  currency: CurrencyCode;
  assignedMonth: number | null;
  isOneTime: boolean;
  baseMonth: number | null;
}

/** One entry in a collapsed installment group's schedule (display-only). */
export interface InstallmentScheduleEntry {
  serverId: string;
  index: number;     // 1-based installment number
  total: number;     // total number of installments
  amount: string;    // per-installment share
  currency: CurrencyCode;
  month: number;     // Gregorian month 1-12
  year: number;      // Gregorian year
  isCurrent: boolean; // true for the viewed month's payment
}

export interface DraftRow extends DraftRowSnapshot {
  localId: string;
  serverId: string | null;
  installmentsTotal: number | null;
  isRecurring: boolean;
  recurringFrequency: TransactionFrequency | null;
  recurringEndDate: string | null;
  status: RowStatus;
  errorMessage: string | null;
  lastSavedSnapshot: DraftRowSnapshot | null;
  currentInstallment?: number;
  mode: DraftRowMode;
  endDate: string | null;
  isBiMonthly: boolean;
  // Installment grouping — display-only, excluded from dirty-tracking/snapshotOf
  installmentGroupId?: string | null;
  installmentIndex?: number | null;
  installmentSchedule?: InstallmentScheduleEntry[];
}

export const snapshotOf = (row: DraftRow): DraftRowSnapshot => ({
  description: row.description,
  categoryId: row.categoryId,
  amount: row.amount,
  needsReview: row.needsReview,
  targetAmount: row.targetAmount,
  currency: row.currency,
  assignedMonth: row.assignedMonth,
  isOneTime: row.isOneTime,
  baseMonth: row.baseMonth,
});

export const snapshotsEqual = (
  a: DraftRowSnapshot | null,
  b: DraftRowSnapshot,
): boolean =>
  a !== null &&
  a.description === b.description &&
  a.categoryId === b.categoryId &&
  a.amount === b.amount &&
  a.needsReview === b.needsReview &&
  a.targetAmount === b.targetAmount &&
  a.currency === b.currency &&
  a.assignedMonth === b.assignedMonth &&
  a.isOneTime === b.isOneTime &&
  a.baseMonth === b.baseMonth;

export type { RowStatus };
