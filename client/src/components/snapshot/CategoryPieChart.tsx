import { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { Category, BudgetItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

type PeriodMode = 'monthly' | 'yearly';

interface CategoryPieChartProps {
  transactions: BudgetItem[];
  categoryById: Map<string, Category>;
  mode: PeriodMode;
}

const PALETTE = [
  '#358383',
  '#163351',
  '#4F8EC9',
  '#E2725B',
  '#A4C76A',
  '#D4A24C',
  '#8E6FB0',
  '#5BB7B0',
  '#C95A7C',
  '#6E8B3D',
];

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

// Main categories consolidated into a single "הוצאות ביתיות" slice so the
// chart isn't dominated by many small, similarly-sized household expenses.
const HOUSING_GROUP_NAME = 'הוצאות ביתיות';
const HOUSING_GROUP_CATEGORIES = new Set([
  'בריאות',
  'הוצאות ביתיות',
  'הוצאות שוטפות',
  'מנויים',
  'שונות שוטפות',
]);

interface CategoryBreakdownItem {
  name: string;
  value: number;
}

interface CategoryChartDatum {
  name: string;
  value: number;
  breakdown?: CategoryBreakdownItem[];
}

// Walks parentCategoryId up from the given category until it finds the
// main/root category (parentCategoryId === null). Falls back to the
// starting category if the chain can't be resolved (e.g. dangling parent
// reference), so a slice is never silently dropped.
const resolveMainCategory = (
  category: Category,
  categoryById: Map<string, Category>,
): Category => {
  let current = category;
  const visited = new Set<string>([current.id]);
  while (current.parentCategoryId !== null) {
    const parent = categoryById.get(current.parentCategoryId);
    if (!parent || visited.has(parent.id)) break;
    current = parent;
    visited.add(current.id);
  }
  return current;
};

function renderCategoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as CategoryChartDatum | undefined;
  if (!datum) return null;

  return (
    <div
      dir="rtl"
      className="bg-surface border border-slate-100 rounded-xl shadow-md p-3 text-sm min-w-[180px]"
    >
      {datum.breakdown && datum.breakdown.length > 0 ? (
        <>
          <p className="label-text mb-2">{datum.name}</p>
          <ul className="space-y-1">
            {datum.breakdown.map((item) => {
              const percentage =
                datum.value > 0
                  ? Math.round((item.value / datum.value) * 100)
                  : 0;
              return (
                <li key={item.name} className="body-text-sm text-slate-600">
                  {`${item.name}: ${currencyFormatter.format(item.value)} (${percentage}%)`}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="body-text-sm text-primary">
          {`${datum.name}: ${currencyFormatter.format(datum.value)}`}
        </p>
      )}
    </div>
  );
}

export default function CategoryPieChart({
  transactions,
  categoryById,
  mode,
}: CategoryPieChartProps) {
  const data = useMemo<CategoryChartDatum[]>(() => {
    const totals = new Map<string, number>();
    // Per-sub-category totals feeding the consolidated housing slice,
    // keyed by main category id, so the tooltip can break them back out.
    const housingBreakdown = new Map<string, number>();

    const targetFrequency =
      mode === 'monthly'
        ? CategoryFrequency.MONTHLY
        : CategoryFrequency.YEARLY;
    transactions.forEach((tx) => {
      if (tx.frequency !== targetFrequency) return;
      if (!tx.categoryId) return;
      const category = categoryById.get(tx.categoryId);
      if (!category || category.type !== CategoryType.EXPENSE) return;

      const mainCategory = resolveMainCategory(category, categoryById);
      const rawAmount = parseFloat(tx.amount) || 0;
      // Bi-monthly items are stored at their full billing-month amount but
      // only actually apply every other month — halve for the monthly
      // average shown here, matching BudgetItemRow's display halving.
      const amount = tx.baseMonth != null ? rawAmount / 2 : rawAmount;

      if (HOUSING_GROUP_CATEGORIES.has(mainCategory.name)) {
        totals.set(
          HOUSING_GROUP_NAME,
          (totals.get(HOUSING_GROUP_NAME) ?? 0) + amount,
        );
        housingBreakdown.set(
          mainCategory.id,
          (housingBreakdown.get(mainCategory.id) ?? 0) + amount,
        );
      } else {
        totals.set(
          mainCategory.id,
          (totals.get(mainCategory.id) ?? 0) + amount,
        );
      }
    });

    return Array.from(totals.entries())
      .map(([key, value]) => {
        if (key === HOUSING_GROUP_NAME) {
          const breakdown = Array.from(housingBreakdown.entries())
            .map(([id, subValue]) => ({
              name: categoryById.get(id)?.name ?? 'אחר',
              value: subValue,
            }))
            .sort((a, b) => b.value - a.value);
          return { name: HOUSING_GROUP_NAME, value, breakdown };
        }
        return { name: categoryById.get(key)?.name ?? 'אחר', value };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categoryById, mode]);

  const isEmpty = data.length === 0;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon
          className="text-accent"
          size={20}
          strokeWidth={ICON_STROKE}
        />
        <h2 className="heading-3">הוצאות לפי קטגוריה</h2>
      </div>

      {isEmpty ? (
        <div className="h-72 flex flex-col items-center justify-center text-slate-400">
          <PieChartIcon size={48} strokeWidth={ICON_STROKE} />
          <p className="body-text-sm mt-3">אין הוצאות לתקופה זו</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={PALETTE[index % PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip content={renderCategoryTooltip} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '0.875rem' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
