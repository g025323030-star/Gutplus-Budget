import type { SuccessResponse } from './common.contracts';

export interface SummaryIncomes {
  monthly: number;
  yearly: number;
}

export interface SummaryExpenses {
  monthly: number;
  yearly: number;
  holidays: number;
  installments: number;
}

export interface MonthlySummary {
  incomes: SummaryIncomes;
  expenses: SummaryExpenses;
  debtRepayments: number;
  balanceBeforeDebts: number;
  balanceAfterDebts: number;
}

export type GetSummaryResponse = SuccessResponse<MonthlySummary>;
