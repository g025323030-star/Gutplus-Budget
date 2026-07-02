import { AssetSide, AssetLiabilityCategory, CurrencyCode } from '../enums';

export interface AssetLiabilityItem {
  id: string;
  name: string;
  side: AssetSide;
  category: AssetLiabilityCategory;
  value: string;
  valueInIls: string;
  currency: CurrencyCode;
  interestRate: string | null;
  targetAmount: string | null;
  urgencyLevel: number | null;
  /** ID of the BudgetItem this was created from (debt-linking) */
  sourceBudgetItemId: string | null;
  /** Monthly-equivalent payment snapshot (ILS) for auto-decrease */
  monthlyPayment: string | null;
  /** 'YYYY-MM' — last month the principal was auto-decreased */
  lastDecreaseYearMonth: string | null;
  familyMemberId: string | null;
  familyMemberName: string | null;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

/** A debt BudgetItem from the Expenses screen, with its optional linked AssetLiabilityItem */
export interface DebtBudgetItemOverview {
  budgetItemId: string;
  description: string;
  /** Monthly-equivalent payment in original currency */
  monthlyPayment: string;
  currency: string;
  endDate: string | null;
  /** Null when the user has not yet set up the remaining principal */
  linkedItem: AssetLiabilityItem | null;
}
