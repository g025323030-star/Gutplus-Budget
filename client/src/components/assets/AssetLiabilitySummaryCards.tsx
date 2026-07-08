import { Landmark, TrendingDown, Scale } from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';
import type { AssetLiabilitySide } from './AssetLiabilityToggle';

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});
const formatILS = (value: number): string => currencyFormatter.format(value);

interface BreakdownRowProps {
  label: string;
  value: number;
  valueClassName?: string;
  bordered?: boolean;
}

function BreakdownRow({ label, value, valueClassName = 'text-slate-600', bordered = true }: BreakdownRowProps) {
  return (
    <div className={`flex items-center justify-between gap-2 py-1 ${bordered ? 'border-t border-slate-100' : ''}`}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${valueClassName}`}>{formatILS(value)}</span>
    </div>
  );
}

interface AssetLiabilitySummaryCardsProps {
  totalAssets: number;
  totalLiabilities: number;
  totalAssetsInterest: number;
  totalLiabilitiesInterest: number;
  /** Annual debt service pulled from the Expenses screen (debtRepayments × 12) */
  debtFromExpensesAnnual: number;
  activeSide: AssetLiabilitySide;
}

export default function AssetLiabilitySummaryCards({
  totalAssets,
  totalLiabilities,
  totalAssetsInterest,
  totalLiabilitiesInterest,
  debtFromExpensesAnnual,
  activeSide,
}: AssetLiabilitySummaryCardsProps) {
  // Liabilities total includes annual debt service from the Expenses screen
  const totalLiabilitiesFull = totalLiabilities + debtFromExpensesAnnual;
  const netWorth = totalAssets - totalLiabilitiesFull;
  const assetsCombined = totalAssets + totalAssetsInterest;
  const liabilitiesCombined = totalLiabilitiesFull + totalLiabilitiesInterest;

  const assetsActive = activeSide === 'assets';
  const liabilitiesActive = activeSide === 'liabilities';

  const assetsCardClass = assetsActive
    ? 'bg-green-50 border-green-200 shadow-md'
    : 'bg-surface border-slate-100 shadow-sm';

  const liabilitiesCardClass = liabilitiesActive
    ? 'bg-red-50 border-red-200 shadow-md'
    : 'bg-surface border-slate-100 shadow-sm';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Assets card */}
      <div className={`rounded-2xl border p-6 transition-all duration-300 ${assetsCardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="label-text">סך נכסים</span>
          <Landmark size={22} strokeWidth={ICON_STROKE} className="text-green-500" />
        </div>
        <p className="heading-3 text-green-500 mb-3">{formatILS(totalAssets)}</p>
        <div className="space-y-0">
          <BreakdownRow label="קרן" value={totalAssets} bordered={false} />
          <BreakdownRow label="תשואה שנתית" value={totalAssetsInterest} valueClassName="text-green-600" />
          <BreakdownRow label='סה"כ כולל תשואה' value={assetsCombined} valueClassName="text-green-600 font-bold" />
        </div>
      </div>

      {/* Liabilities card */}
      <div className={`rounded-2xl border p-6 transition-all duration-300 ${liabilitiesCardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="label-text">סך התחייבויות</span>
          <TrendingDown size={22} strokeWidth={ICON_STROKE} className="text-red-500" />
        </div>
        <p className="heading-3 text-red-500 mb-3">{formatILS(totalLiabilitiesFull)}</p>
        <div className="space-y-0">
          <BreakdownRow label="חובות ישירים" value={totalLiabilities} bordered={false} />
          {debtFromExpensesAnnual > 0 && (
            <BreakdownRow label="שירות חוב שנתי (הוצאות)" value={debtFromExpensesAnnual} valueClassName="text-red-400" />
          )}
          <BreakdownRow label="ריבית שנתית" value={totalLiabilitiesInterest} valueClassName="text-red-500" />
          <BreakdownRow label='סה"כ כולל ריבית' value={liabilitiesCombined} valueClassName="text-red-600 font-bold" />
        </div>
      </div>

      {/* Net worth card — always full-weight */}
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="label-text">שווי נטו</span>
          <Scale size={22} strokeWidth={ICON_STROKE} className="text-accent" />
        </div>
        <p className={`heading-3 mb-3 ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatILS(netWorth)}
        </p>
        <div className="space-y-0">
          <BreakdownRow
            label="נכסים − חובות (קרן)"
            value={totalAssets - totalLiabilitiesFull}
            valueClassName={(totalAssets - totalLiabilitiesFull) >= 0 ? 'text-green-600' : 'text-red-500'}
            bordered={false}
          />
          <BreakdownRow
            label="נכסים − חובות (כולל ריבית)"
            value={assetsCombined - liabilitiesCombined}
            valueClassName={(assetsCombined - liabilitiesCombined) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}
          />
        </div>
      </div>
    </div>
  );
}
