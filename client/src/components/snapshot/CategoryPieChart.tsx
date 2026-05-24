import { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CategoryFrequency, CategoryType } from '@gutplus/shared';
import type { Category, Transaction } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

type PeriodMode = 'monthly' | 'yearly';

interface CategoryPieChartProps {
  transactions: Transaction[];
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

export default function CategoryPieChart({
  transactions,
  categoryById,
  mode,
}: CategoryPieChartProps) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();

    const targetFrequency =
      mode === 'monthly'
        ? CategoryFrequency.MONTHLY
        : CategoryFrequency.YEARLY;
    transactions.forEach((tx) => {
      if (tx.frequency !== targetFrequency) return;
      if (!tx.categoryId) return;
      const category = categoryById.get(tx.categoryId);
      if (!category || category.type !== CategoryType.EXPENSE) return;

      const amount = parseFloat(tx.amount) || 0;
      totals.set(category.id, (totals.get(category.id) ?? 0) + amount);
    });

    return Array.from(totals.entries())
      .map(([id, value]) => ({
        name: categoryById.get(id)?.name ?? 'אחר',
        value,
      }))
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
            <Tooltip
              formatter={(value) =>
                currencyFormatter.format(Number(value) || 0)
              }
            />
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
