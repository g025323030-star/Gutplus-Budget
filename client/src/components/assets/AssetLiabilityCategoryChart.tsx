import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AssetLiabilityCategory } from '@gutplus/shared';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './category-visuals';
import type { AssetLiabilitySide } from './AssetLiabilityToggle';

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

interface ChartDatum {
  name: string;
  value: number;
  color: string;
  category: AssetLiabilityCategory;
}

interface AssetLiabilityCategoryChartProps {
  breakdown: Map<AssetLiabilityCategory, number>;
  activeSide: AssetLiabilitySide;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: ChartDatum = payload[0].payload;
  return (
    <div
      className="bg-surface border border-slate-200 rounded-xl shadow-md px-3 py-2 text-right"
      dir="rtl"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: d.color }}
        />
        <span className="label-text text-primary text-xs">{d.name}</span>
      </div>
      <p className="body-text-sm font-bold tabular-nums text-primary">
        {currencyFormatter.format(d.value)}
      </p>
    </div>
  );
}

export default function AssetLiabilityCategoryChart({
  breakdown,
  activeSide,
  total,
}: AssetLiabilityCategoryChartProps) {
  const data: ChartDatum[] = [...breakdown.entries()]
    .filter(([, v]) => v > 0)
    .map(([cat, v]) => ({
      name: CATEGORY_LABELS[cat],
      value: v,
      color: CATEGORY_COLORS[cat],
      category: cat,
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="heading-3 mb-4">
        פירוט לפי קטגוריה — {activeSide === 'assets' ? 'נכסים' : 'התחייבויות'}
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="w-full md:w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + values */}
        <div className="flex-1 w-full space-y-2">
          {data.map((entry) => {
            const pct = total > 0 ? (entry.value / total) * 100 : 0;
            return (
              <div key={entry.category} className="space-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-slate-600 truncate">{entry.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                    {currencyFormatter.format(entry.value)}
                  </span>
                </div>
                {/* Percentage bar */}
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: entry.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
