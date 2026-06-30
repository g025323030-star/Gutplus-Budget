import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { BudgetLineItem, Holiday } from '@gutplus/shared';
import { HOLIDAY_EXPENSE_TEMPLATES } from '@gutplus/shared';
import { ICON_STROKE } from '../../../constants/ui';
import {
  EXPENSE_BUCKETS,
  INCOME_BUCKETS,
  sumActualForItems as sumActual,
  sumPlannedForItems as sumPlanned,
} from '../budget.utils';

interface SummaryCardsProps {
  /** The selected month's resolved line items — the single source of truth
   * also driving the accordion rows below, so the two stay in sync. */
  lineItems: BudgetLineItem[];
  /** Holidays whose items land in this month (Budget/exact-timing context only). */
  holidays?: Holiday[];
}

// Built from the holiday templates' displayName (already the canonical
// Hebrew name shown elsewhere, e.g. the Yearly/Holiday expenses screen).
// TU_BISHVAT and HASIDIS_EVENT have no template entry, so they're filled in
// here directly.
const HOLIDAY_DISPLAY_NAMES: Partial<Record<Holiday, string>> = {
  TU_BISHVAT: 'ט"ו בשבט',
  HASIDIS_EVENT: 'אירוע חסידי',
};
for (const template of HOLIDAY_EXPENSE_TEMPLATES) {
  HOLIDAY_DISPLAY_NAMES[template.holiday] = template.displayName;
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

const formatILS = (value: number): string => currencyFormatter.format(value);

interface CardShellProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function CardShell({ label, icon, children }: CardShellProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="label-text">{label}</span>
        {icon}
      </div>
      {children}
    </div>
  );
}

interface SubRowProps {
  label: string;
  value: number;
  bordered?: boolean;
  valueClassName?: string;
}

// A muted breakdown line: subtle label on one side, value on the other.
function SubRow({ label, value, bordered = false, valueClassName }: SubRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-1.5 ${
        bordered ? 'mt-1.5 pt-2.5 border-t border-slate-100' : ''
      }`}
    >
      <span className="body-text-sm text-slate-500">{label}</span>
      <span
        className={`body-text-sm font-medium ${
          valueClassName ?? 'text-slate-600'
        }`}
      >
        {formatILS(value)}
      </span>
    </div>
  );
}

interface PlannedActualHeadlineProps {
  planned: number;
  actual: number;
  colorClassName: string;
}

// The card's main headline: planned and actual side by side, both clearly
// labeled in Hebrew. Planned keeps the card's thematic color (red/green);
// actual is intentionally muted — it's a secondary lens on the same figure,
// not a judgment (per-line-item exceedance coloring already lives in the
// accordion rows below).
function PlannedActualHeadline({
  planned,
  actual,
  colorClassName,
}: PlannedActualHeadlineProps) {
  return (
    <div className="flex items-end gap-4 mb-3 flex-wrap">
      <div>
        <span className="body-text-sm text-slate-400 block mb-0.5">מתוכנן</span>
        <p className={`heading-3 ${colorClassName}`}>{formatILS(planned)}</p>
      </div>
      <div>
        <span className="body-text-sm text-slate-400 block mb-0.5">בפועל</span>
        <p className="heading-3 text-slate-500">{formatILS(actual)}</p>
      </div>
    </div>
  );
}

interface BalanceMetricRowProps {
  label: string;
  planned: number;
  actual: number;
  bordered?: boolean;
}

// One net-balance scope (excluding/including debts), planned and actual side
// by side — each colored green/red by its own sign, independent of the
// other.
function BalanceMetricRow({ label, planned, actual, bordered = false }: BalanceMetricRowProps) {
  const plannedClass = planned >= 0 ? 'text-green-500' : 'text-red-500';
  const actualClass = actual >= 0 ? 'text-green-500' : 'text-red-500';
  return (
    <div className={`py-2 ${bordered ? 'mt-1.5 pt-3 border-t border-slate-100' : ''}`}>
      <span className="body-text-sm text-slate-500 block mb-1.5">{label}</span>
      <div className="flex items-center gap-5">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">מתוכנן</span>
          <span className={`body-text font-semibold ${plannedClass}`}>
            {formatILS(planned)}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">בפועל</span>
          <span className={`body-text font-semibold ${actualClass}`}>
            {formatILS(actual)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ lineItems, holidays }: SummaryCardsProps) {
  const holidayNames = (holidays ?? [])
    .map((h) => HOLIDAY_DISPLAY_NAMES[h] ?? h)
    .join(', ');

  const incomeItems = lineItems.filter((item) => INCOME_BUCKETS.includes(item.bucket));
  const expenseItems = lineItems.filter((item) => EXPENSE_BUCKETS.includes(item.bucket));
  const debtItems = lineItems.filter((item) => item.bucket === 'debt');

  const recurringExpenseItems = expenseItems.filter(
    (item) => item.bucket === 'expenseMonthly' || item.bucket === 'expenseInstallments',
  );
  const specialExpenseItems = expenseItems.filter(
    (item) => item.bucket !== 'expenseMonthly' && item.bucket !== 'expenseInstallments',
  );
  const monthlyIncomeItems = incomeItems.filter((item) => item.bucket === 'incomeMonthly');
  const yearlyIncomeItems = incomeItems.filter((item) => item.bucket === 'incomeYearly');

  // Card 1 — total expenses (planned vs. actual).
  const plannedExpenses = sumPlanned(expenseItems);
  const actualExpenses = sumActual(expenseItems);

  // Card 2 — total income (planned vs. actual).
  const plannedIncome = sumPlanned(incomeItems);
  const actualIncome = sumActual(incomeItems);

  // Card 3 — net balance only, planned vs. actual, excluding/including debt.
  // Sourced from the same lineItems so it stays in sync with cards 1/2 and
  // the accordion rows below, rather than a separately-fetched snapshot.
  const plannedDebt = sumPlanned(debtItems);
  const actualDebt = sumActual(debtItems);
  const balanceBeforePlanned = plannedIncome - plannedExpenses;
  const balanceBeforeActual = actualIncome - actualExpenses;
  const balanceAfterPlanned = balanceBeforePlanned - plannedDebt;
  const balanceAfterActual = balanceBeforeActual - actualDebt;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1 — total expenses */}
      <CardShell
        label="סך הוצאות"
        icon={
          <TrendingDown
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
      >
        {holidayNames && (
          <div className="border border-amber-300 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">
            <span className="body-text-sm text-amber-700">
              חג בחודש זה: {holidayNames}
            </span>
          </div>
        )}
        <PlannedActualHeadline
          planned={plannedExpenses}
          actual={actualExpenses}
          colorClassName="text-red-500"
        />
        <SubRow label="הוצאות קבועות" value={sumPlanned(recurringExpenseItems)} />
        <SubRow
          label="הוצאות שנתיות/חגים/תשלומים (ממוצע חודשי)"
          value={sumPlanned(specialExpenseItems)}
        />
      </CardShell>

      {/* Card 2 — total income */}
      <CardShell
        label="סך הכנסות"
        icon={
          <TrendingUp
            className="text-green-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
        }
      >
        <PlannedActualHeadline
          planned={plannedIncome}
          actual={actualIncome}
          colorClassName="text-green-500"
        />
        <SubRow label="הכנסות שוטפות חודשיות" value={sumPlanned(monthlyIncomeItems)} />
        <SubRow
          label="הכנסות שנתיות (ממוצע חודשי)"
          value={sumPlanned(yearlyIncomeItems)}
        />
      </CardShell>

      {/* Card 3 — net balance, planned vs. actual, excluding/including debt */}
      <CardShell
        label="יתרות פיננסיות"
        icon={
          <Wallet className="text-accent" size={22} strokeWidth={ICON_STROKE} />
        }
      >
        <BalanceMetricRow
          label="יתרה ללא חובות"
          planned={balanceBeforePlanned}
          actual={balanceBeforeActual}
        />
        <BalanceMetricRow
          label="יתרה כולל חובות"
          planned={balanceAfterPlanned}
          actual={balanceAfterActual}
          bordered
        />
      </CardShell>
    </div>
  );
}
