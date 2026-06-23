/**
 * Expense parent-category names that are pulled out of the general budget
 * summary into their own rows (in addition to the debt and holiday breakouts,
 * which the summary engine separates through dedicated mechanisms).
 *
 * Matching is by the parent category name; the whole subtree is included.
 * Shared so the server engine and the client budget page agree on the keys.
 */
export const BUDGET_BREAKOUT_EXPENSE_PARENTS = [
  'מעשרות וצדקה',
  'ירידת פריון עבודה',
] as const;

export type BudgetBreakoutName = (typeof BUDGET_BREAKOUT_EXPENSE_PARENTS)[number];
