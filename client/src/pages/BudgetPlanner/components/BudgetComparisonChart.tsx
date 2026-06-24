import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { BudgetLineItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../../constants/ui';
import type { BudgetViewData } from '../budget.utils';

interface BudgetComparisonChartProps {
  data: BudgetViewData;
  lineItemsByMonth: BudgetLineItem[][];
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export default function BudgetComparisonChart({
  data,
  lineItemsByMonth,
}: BudgetComparisonChartProps) {
  const chartData = useMemo(
    () =>
      data.monthLabels.map((label, index) => {
        const items = lineItemsByMonth[index] ?? [];
        const forecast = items.reduce(
          (sum, item) => sum + (Number(item.currentForecast) || 0),
          0,
        );
        // Months with no actuals logged yet sum to 0 — expected, not a bug.
        const actual = items.reduce(
          (sum, item) => sum + (Number(item.actual ?? '0') || 0),
          0,
        );
        return { label, forecast, actual };
      }),
    [data.monthLabels, lineItemsByMonth],
  );

  const isEmpty = chartData.every((m) => m.forecast === 0 && m.actual === 0);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="text-accent" size={20} strokeWidth={ICON_STROKE} />
        <h2 className="heading-3">תקציב מתוכנן מול ביצוע בפועל</h2>
      </div>

      {isEmpty ? (
        <div className="h-72 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} strokeWidth={ICON_STROKE} />
          <p className="body-text-sm mt-3">אין עדיין נתונים להשוואה</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => currencyFormatter.format(Number(value) || 0)}
              width={80}
            />
            <Tooltip
              formatter={(value) => currencyFormatter.format(Number(value) || 0)}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '0.875rem' }}
              formatter={(value) =>
                value === 'forecast' ? 'תחזית נוכחית' : 'בפועל'
              }
            />
            <Bar dataKey="forecast" name="forecast" fill="#358383" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="actual" fill="#163351" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
