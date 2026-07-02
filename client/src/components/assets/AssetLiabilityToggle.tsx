export type AssetLiabilitySide = 'assets' | 'liabilities';

interface AssetLiabilityToggleProps {
  side: AssetLiabilitySide;
  onSideChange: (side: AssetLiabilitySide) => void;
}

export default function AssetLiabilityToggle({ side, onSideChange }: AssetLiabilityToggleProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center bg-background rounded-xl p-1"
        role="tablist"
        aria-label="בחירת תצוגה"
      >
        <button
          role="tab"
          aria-pressed={side === 'assets'}
          onClick={() => onSideChange('assets')}
          className={`px-4 py-2 rounded-lg label-text transition-all duration-300 ${
            side === 'assets'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-primary hover:bg-slate-100'
          }`}
        >
          נכסים
        </button>
        <button
          role="tab"
          aria-pressed={side === 'liabilities'}
          onClick={() => onSideChange('liabilities')}
          className={`px-4 py-2 rounded-lg label-text transition-all duration-300 ${
            side === 'liabilities'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-primary hover:bg-slate-100'
          }`}
        >
          התחייבויות
        </button>
      </div>
    </div>
  );
}
