import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ICON_STROKE } from '../../../constants/ui';

interface MonthCarouselProps {
  monthLabels: string[];
  selectedMonth: number;
  onSelect: (index: number) => void;
}

export default function MonthCarousel({
  monthLabels,
  selectedMonth,
  onSelect,
}: MonthCarouselProps) {
  const count = monthLabels.length;
  // Circular navigation (RTL: right arrow → previous, left arrow → next).
  const goPrev = () => onSelect((selectedMonth - 1 + count) % count);
  const goNext = () => onSelect((selectedMonth + 1) % count);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goPrev}
        aria-label="חודש קודם"
        className="shrink-0 p-2 rounded-xl bg-slate-100 text-[#2D5A59] hover:bg-slate-200 transition-all duration-200"
      >
        <ChevronRight size={20} strokeWidth={ICON_STROKE} />
      </button>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          {monthLabels.map((label, index) => {
            const active = index === selectedMonth;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelect(index)}
                aria-pressed={active}
                className={`shrink-0 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 body-text-sm ${
                  active
                    ? 'bg-[#2D5A59] text-white shadow-md font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={goNext}
        aria-label="חודש הבא"
        className="shrink-0 p-2 rounded-xl bg-slate-100 text-[#2D5A59] hover:bg-slate-200 transition-all duration-200"
      >
        <ChevronLeft size={20} strokeWidth={ICON_STROKE} />
      </button>
    </div>
  );
}
