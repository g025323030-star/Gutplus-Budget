import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import SaveIndicator from './SaveIndicator';
import type { DraftRow } from './types';

interface TransactionRowProps {
  row: DraftRow;
  categories: Category[];
  monthConstraint?: number;
  yearConstraint: number;
  autoFocus?: boolean;
  onPatch: (patch: Partial<DraftRow>) => void;
  onBlurOutside: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

type FieldKey = 'description' | 'categoryId' | 'amount' | 'date';

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-4 py-2.5 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

const SELECT_CLASS = `${INPUT_CLASS} appearance-none cursor-pointer pr-3`;

const padTwo = (n: number): string => String(n).padStart(2, '0');

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

const buildDateBounds = (
  yearConstraint: number,
  monthConstraint?: number,
): { min: string; max: string } => {
  if (monthConstraint) {
    const last = lastDayOfMonth(yearConstraint, monthConstraint);
    return {
      min: `${yearConstraint}-${padTwo(monthConstraint)}-01`,
      max: `${yearConstraint}-${padTwo(monthConstraint)}-${padTwo(last)}`,
    };
  }
  return {
    min: `${yearConstraint}-01-01`,
    max: `${yearConstraint}-12-31`,
  };
};

const validateField = (
  key: FieldKey,
  row: DraftRow,
  yearConstraint: number,
  monthConstraint?: number,
): string | null => {
  switch (key) {
    case 'description':
      return row.description.trim().length > 0 ? null : 'תיאור חובה';
    case 'categoryId':
      return row.categoryId ? null : 'קטגוריה חובה';
    case 'amount': {
      const num = Number(row.amount);
      return Number.isFinite(num) && num > 0
        ? null
        : 'סכום חייב להיות גדול מ-0';
    }
    case 'date': {
      if (!row.date) return 'תאריך חובה';
      const d = new Date(row.date);
      if (Number.isNaN(d.getTime())) return 'תאריך לא תקין';
      if (d.getFullYear() !== yearConstraint)
        return 'התאריך מחוץ לתקופה הנבחרת';
      if (monthConstraint && d.getMonth() + 1 !== monthConstraint)
        return 'התאריך מחוץ לחודש הנבחר';
      return null;
    }
    default:
      return null;
  }
};

export default function TransactionRow({
  row,
  categories,
  monthConstraint,
  yearConstraint,
  autoFocus = false,
  onPatch,
  onBlurOutside,
  onRemove,
  onRetry,
}: TransactionRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLInputElement | null>(null);
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    description: false,
    categoryId: false,
    amount: false,
    date: false,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (autoFocus && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!confirmingDelete) return;
    const t = window.setTimeout(() => setConfirmingDelete(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmingDelete]);

  const bounds = buildDateBounds(yearConstraint, monthConstraint);

  const handleRowBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const nextFocus = e.relatedTarget as Node | null;
    if (rowRef.current && nextFocus && rowRef.current.contains(nextFocus)) {
      return;
    }
    onBlurOutside();
  };

  const handleDeleteClick = () => {
    if (row.serverId === null) {
      onRemove();
      return;
    }
    if (confirmingDelete) {
      onRemove();
    } else {
      setConfirmingDelete(true);
    }
  };

  const errorFor = (key: FieldKey): string | null =>
    touched[key] ? validateField(key, row, yearConstraint, monthConstraint) : null;

  const fieldClass = (key: FieldKey): string =>
    errorFor(key)
      ? `${INPUT_CLASS} border-red-300 focus:border-red-400`
      : INPUT_CLASS;

  const selectClass = (key: FieldKey): string =>
    errorFor(key)
      ? `${SELECT_CLASS} border-red-300 focus:border-red-400`
      : SELECT_CLASS;

  return (
    <motion.div
      ref={rowRef}
      onBlur={handleRowBlur}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-surface rounded-2xl border border-slate-100 p-4 md:p-3 md:bg-transparent md:border-0 md:border-b md:border-slate-100 md:rounded-none md:hover:bg-slate-50/60 transition-colors duration-200"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] md:gap-4 md:items-start">
        <div>
          <label className="label-text mb-1 block md:hidden">תיאור</label>
          <input
            ref={descriptionRef}
            type="text"
            value={row.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            onBlur={() =>
              setTouched((t) => ({ ...t, description: true }))
            }
            placeholder="לדוגמה: סופר"
            aria-label="תיאור"
            className={fieldClass('description')}
          />
          {errorFor('description') && (
            <p className="body-text-sm text-red-500 mt-1">
              {errorFor('description')}
            </p>
          )}
        </div>

        <div>
          <label className="label-text mb-1 block md:hidden">קטגוריה</label>
          <select
            value={row.categoryId ?? ''}
            onChange={(e) =>
              onPatch({ categoryId: e.target.value || null })
            }
            onBlur={() => setTouched((t) => ({ ...t, categoryId: true }))}
            aria-label="קטגוריה"
            className={selectClass('categoryId')}
          >
            <option value="">בחר קטגוריה</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errorFor('categoryId') && (
            <p className="body-text-sm text-red-500 mt-1">
              {errorFor('categoryId')}
            </p>
          )}
        </div>

        <div>
          <label className="label-text mb-1 block md:hidden">סכום (₪)</label>
          <input
            type="text"
            inputMode="decimal"
            value={row.amount}
            onChange={(e) => onPatch({ amount: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            placeholder="0"
            aria-label="סכום"
            className={fieldClass('amount')}
          />
          {errorFor('amount') && (
            <p className="body-text-sm text-red-500 mt-1">
              {errorFor('amount')}
            </p>
          )}
        </div>

        <div>
          <label className="label-text mb-1 block md:hidden">תאריך</label>
          <input
            type="date"
            value={row.date}
            min={bounds.min}
            max={bounds.max}
            onChange={(e) => onPatch({ date: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, date: true }))}
            aria-label="תאריך"
            className={fieldClass('date')}
          />
          {errorFor('date') && (
            <p className="body-text-sm text-red-500 mt-1">
              {errorFor('date')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 md:pt-1">
          <SaveIndicator
            status={row.status}
            errorMessage={row.errorMessage}
            onRetry={onRetry}
          />
          <AnimatePresence mode="wait" initial={false}>
            {confirmingDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1"
              >
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg label-text hover:bg-red-600 transition-colors duration-200"
                  aria-label="אישור מחיקה"
                >
                  מחק
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors duration-200"
                  aria-label="ביטול מחיקה"
                >
                  <X size={16} strokeWidth={ICON_STROKE} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trash"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleDeleteClick}
                aria-label="מחיקת שורה"
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
              >
                <Trash2 size={18} strokeWidth={ICON_STROKE} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export const validateRow = (
  row: DraftRow,
  yearConstraint: number,
  monthConstraint?: number,
): boolean =>
  (['description', 'categoryId', 'amount', 'date'] as FieldKey[]).every(
    (key) => validateField(key, row, yearConstraint, monthConstraint) === null,
  );
