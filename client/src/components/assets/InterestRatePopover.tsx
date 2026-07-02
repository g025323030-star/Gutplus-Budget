import { useEffect, useRef, useState } from 'react';
import { Percent, X } from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';

interface InterestRatePopoverProps {
  interestRate: string | null;
  onSave: (value: string | null) => void;
}

export default function InterestRatePopover({ interestRate, onSave }: InterestRatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(interestRate ?? '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasRate = interestRate !== null && interestRate !== '';

  const handleOpen = () => {
    setDraft(interestRate ?? '');
    setOpen(true);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = () => {
    const trimmed = draft.trim();
    const num = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(num) || num <= 0) {
      onSave(null);
    } else {
      onSave(trimmed);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setDraft('');
    onSave(null);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={hasRate ? `ריבית מוגדרת: ${interestRate}%` : 'הגדר ריבית שנתית'}
        title={hasRate ? `ריבית: ${interestRate}%` : 'הגדר ריבית שנתית'}
        className={`p-2 rounded-lg transition-colors duration-200 ${
          hasRate
            ? 'text-accent bg-accent/10 hover:bg-accent/20'
            : 'text-slate-400 hover:text-accent hover:bg-slate-100'
        }`}
      >
        <Percent
          size={18}
          strokeWidth={ICON_STROKE}
          className={hasRate ? 'fill-accent/20' : ''}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-surface border border-slate-200 rounded-2xl shadow-md p-4 w-64"
          role="dialog"
          aria-modal="true"
          aria-label="הגדרת ריבית שנתית"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="label-text font-bold text-primary">ריבית שנתית (%)</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors duration-200"
            >
              <X size={14} strokeWidth={ICON_STROKE} />
            </button>
          </div>

          <p className="body-text-sm text-slate-400 mb-3">
            ישמש לחישוב עלות הריבית השנתית הכוללת
          </p>

          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="לדוגמה: 5.5"
            aria-label="אחוז ריבית שנתית"
            className="w-full bg-background/60 border border-slate-200 rounded-xl px-3 py-2 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200 body-text-sm mb-3"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-accent text-white px-3 py-1.5 rounded-xl label-text hover:bg-accent/90 transition-colors duration-200"
            >
              שמור
            </button>
            {hasRate && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl label-text text-red-500 border border-red-200 hover:bg-red-50 transition-colors duration-200"
              >
                נקה
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
