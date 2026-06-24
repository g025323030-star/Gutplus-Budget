import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import type { BudgetLineItem, Category } from '@gutplus/shared';
import { CategoryType } from '@gutplus/shared';
import { ICON_STROKE } from '../../../constants/ui';
import { upsertExecution } from '../../../services/execution.service';
import {
  calculateExpenseTotal,
  calculateIncomeTotal,
  formatILS,
  getMonthlyBalance,
  type BudgetViewData,
} from '../budget.utils';

const UNCATEGORIZED_LABEL = 'ללא קטגוריה';

interface BudgetCategoryCardsProps {
  data: BudgetViewData;
  monthIndex: number;
  month: number;
  year: number;
  lineItems: BudgetLineItem[];
  categoryById: Map<string, Category>;
  onLineItemsChange: (items: BudgetLineItem[]) => void;
}

interface CategoryGroup {
  categoryId: string | null;
  name: string;
  items: BudgetLineItem[];
  totalCurrentForecast: number;
}

const groupByCategory = (
  items: BudgetLineItem[],
  categoryById: Map<string, Category>,
  type: CategoryType,
): CategoryGroup[] => {
  const groups = new Map<string, CategoryGroup>();

  items.forEach((item) => {
    const category = item.categoryId ? categoryById.get(item.categoryId) : undefined;
    // Items whose category resolves to the other type are skipped here (they
    // belong in the other list). Items with no category (or an
    // unresolvable categoryId) have no type of their own to key off of —
    // by judgment call they're bucketed into the EXPENSE list only, under
    // a literal "ללא קטגוריה" group, rather than appearing in both lists or
    // being dropped silently. See report for rationale.
    if (category) {
      if (category.type !== type) return;
    } else if (type !== CategoryType.EXPENSE) {
      return;
    }

    const key = item.categoryId ?? '__uncategorized__';
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        categoryId: item.categoryId,
        name: category?.name ?? UNCATEGORIZED_LABEL,
        items: [item],
        totalCurrentForecast: 0,
      });
    }
  });

  groups.forEach((group) => {
    group.totalCurrentForecast = group.items.reduce(
      (sum, item) => sum + (Number(item.currentForecast) || 0),
      0,
    );
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.totalCurrentForecast - a.totalCurrentForecast,
  );
};

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClassName: string;
}

function KpiCard({ label, value, icon, valueClassName }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="label-text">{label}</span>
        {icon}
      </div>
      <p className={`heading-3 ${valueClassName}`}>{formatILS(value)}</p>
    </div>
  );
}

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-3 py-2 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200 text-sm';

type SaveState = 'idle' | 'saving' | 'error';

interface LineItemRowProps {
  item: BudgetLineItem;
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
  ) => Promise<void>;
}

function LineItemRow({ item, onCommit }: LineItemRowProps) {
  const [currentForecastDraft, setCurrentForecastDraft] = useState(item.currentForecast);
  const [actualDraft, setActualDraft] = useState(item.actual ?? '');
  const [forecastSaveState, setForecastSaveState] = useState<SaveState>('idle');
  const [actualSaveState, setActualSaveState] = useState<SaveState>('idle');

  // Draft state is seeded from `item` once on mount only. Since
  // `CategoryAccordion` keys each row by `budgetItemId` and a given
  // budget item only ever appears under one month's line-items array, a
  // month switch naturally unmounts/remounts this component (fresh
  // initial state) rather than requiring an effect-based resync. A
  // successful save updates `item` in the parent, which is fine because
  // by that point the draft already matches the saved value.

  const hasActual = item.actual !== null && actualDraft.trim() !== '';
  const numericActual = Number(actualDraft);
  const numericForecast = Number(currentForecastDraft);

  const isExceedance =
    hasActual &&
    Number.isFinite(numericActual) &&
    Number.isFinite(numericForecast) &&
    numericActual.toFixed(2) !== numericForecast.toFixed(2) &&
    numericActual > numericForecast;

  const isUnderBudget =
    hasActual &&
    Number.isFinite(numericActual) &&
    Number.isFinite(numericForecast) &&
    numericActual.toFixed(2) !== numericForecast.toFixed(2) &&
    numericActual < numericForecast;

  // Neither exceedance nor under-budget (exact match, or actual not yet
  // entered/not a valid number) → neutral style, no subtext.
  const actualInputClass = isExceedance
    ? 'border-rose-300 text-rose-600 focus:border-rose-400'
    : isUnderBudget
      ? 'border-emerald-300 text-emerald-600 focus:border-emerald-400'
      : 'border-slate-200 text-primary focus:border-accent';

  const subtext = isExceedance
    ? 'חריגה מהתקציב שנקבע'
    : isUnderBudget
      ? `יתרת תקציב ע"ס ${formatILS(numericForecast - numericActual)}`
      : null;

  const handleForecastBlur = async () => {
    if (currentForecastDraft === item.currentForecast) return;
    const num = Number(currentForecastDraft);
    if (!Number.isFinite(num)) {
      setCurrentForecastDraft(item.currentForecast);
      return;
    }
    setForecastSaveState('saving');
    try {
      await onCommit(item.budgetItemId, { forecastOverride: num.toFixed(2) });
      setForecastSaveState('idle');
    } catch (err) {
      console.error('Error saving forecast override:', err);
      setForecastSaveState('error');
    }
  };

  const handleActualBlur = async () => {
    if (actualDraft === (item.actual ?? '')) return;
    if (actualDraft.trim() === '') return;
    const num = Number(actualDraft);
    if (!Number.isFinite(num)) {
      setActualDraft(item.actual ?? '');
      return;
    }
    setActualSaveState('saving');
    try {
      await onCommit(item.budgetItemId, { actual: num.toFixed(2) });
      setActualSaveState('idle');
    } catch (err) {
      console.error('Error saving actual:', err);
      setActualSaveState('error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-3 md:items-start px-3 py-3 rounded-xl bg-slate-50/60 border border-slate-100">
      <div className="flex items-center">
        <span className="body-text-sm text-primary truncate">{item.description}</span>
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">תחזית בסיס</span>
        <span dir="ltr" className="body-text-sm tabular-nums text-slate-500 block">
          {formatILS(Number(item.baselineForecast) || 0)}
        </span>
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">תחזית נוכחית</span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={currentForecastDraft}
          onChange={(e) => setCurrentForecastDraft(e.target.value)}
          onBlur={handleForecastBlur}
          aria-label="תחזית נוכחית"
          className={INPUT_CLASS}
        />
        {forecastSaveState === 'error' && (
          <p className="body-text-sm text-rose-500 mt-1">שגיאה בשמירה, נסה שוב</p>
        )}
      </div>

      <div>
        <span className="label-text block mb-1 md:hidden">בפועל</span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={actualDraft}
          onChange={(e) => setActualDraft(e.target.value)}
          onBlur={handleActualBlur}
          placeholder="—"
          aria-label="בפועל"
          className={`${INPUT_CLASS} ${actualInputClass}`}
        />
        {subtext && (
          <p
            className={`body-text-sm mt-1 ${
              isExceedance ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            {subtext}
          </p>
        )}
        {actualSaveState === 'error' && (
          <p className="body-text-sm text-rose-500 mt-1">שגיאה בשמירה, נסה שוב</p>
        )}
      </div>
    </div>
  );
}

interface CategoryAccordionProps {
  group: CategoryGroup;
  onCommit: (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
  ) => Promise<void>;
}

function CategoryAccordion({ group, onCommit }: CategoryAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-100 bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors duration-200"
      >
        <span className="body-text font-medium text-primary">{group.name}</span>
        <div className="flex items-center gap-2">
          <span dir="ltr" className="body-text-sm font-semibold tabular-nums text-slate-600">
            {formatILS(group.totalCurrentForecast)}
          </span>
          <ChevronDown
            size={18}
            strokeWidth={ICON_STROKE}
            className={`text-slate-400 transition-transform duration-200 ${
              expanded ? '' : '-rotate-90'
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100">
              {group.items.map((item) => (
                <LineItemRow key={item.budgetItemId} item={item} onCommit={onCommit} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BudgetCategoryCards({
  data,
  monthIndex,
  month,
  year,
  lineItems,
  categoryById,
  onLineItemsChange,
}: BudgetCategoryCardsProps) {
  const income = calculateIncomeTotal(data, monthIndex);
  const expense = calculateExpenseTotal(data, monthIndex);
  const balance = getMonthlyBalance(data, monthIndex);
  const balanceClass = balance >= 0 ? 'text-emerald-600' : 'text-rose-600';

  const incomeGroups = useMemo(
    () => groupByCategory(lineItems, categoryById, CategoryType.INCOME),
    [lineItems, categoryById],
  );
  const expenseGroups = useMemo(
    () => groupByCategory(lineItems, categoryById, CategoryType.EXPENSE),
    [lineItems, categoryById],
  );

  const handleCommit = async (
    budgetItemId: string,
    patch: { forecastOverride?: string } | { actual?: string },
  ): Promise<void> => {
    await upsertExecution(budgetItemId, month, year, patch);
    const next = lineItems.map((item) =>
      item.budgetItemId === budgetItemId ? { ...item, ...patch } : item,
    );
    onLineItemsChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="סך הכנסות חודשי"
          value={income}
          icon={<TrendingUp className="text-emerald-600" size={22} strokeWidth={ICON_STROKE} />}
          valueClassName="text-emerald-600"
        />
        <KpiCard
          label="סך הוצאות חודשי"
          value={expense}
          icon={<TrendingDown className="text-rose-600" size={22} strokeWidth={ICON_STROKE} />}
          valueClassName="text-rose-600"
        />
        <KpiCard
          label="יתרה חודשית נטו"
          value={balance}
          icon={<Scale className="text-[#2D5A59]" size={22} strokeWidth={ICON_STROKE} />}
          valueClassName={balanceClass}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="heading-3 text-emerald-600">הכנסות לפי קטגוריה</h3>
          {incomeGroups.length === 0 ? (
            <p className="body-text-sm text-slate-400">אין נתוני הכנסה לחודש זה</p>
          ) : (
            incomeGroups.map((group) => (
              <CategoryAccordion
                key={group.categoryId ?? '__uncategorized_income__'}
                group={group}
                onCommit={handleCommit}
              />
            ))
          )}
        </div>
        <div className="space-y-3">
          <h3 className="heading-3 text-rose-600">הוצאות לפי קטגוריה</h3>
          {expenseGroups.length === 0 ? (
            <p className="body-text-sm text-slate-400">אין נתוני הוצאה לחודש זה</p>
          ) : (
            expenseGroups.map((group) => (
              <CategoryAccordion
                key={group.categoryId ?? '__uncategorized_expense__'}
                group={group}
                onCommit={handleCommit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
