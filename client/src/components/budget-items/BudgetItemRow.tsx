import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CreditCard, Repeat, Trash2, X } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { CurrencyCode } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import CategoryCombobox from './CategoryCombobox';
import SaveIndicator from './SaveIndicator';
import TargetPopover from './TargetPopover';
import type { DraftRow } from './types';

interface BudgetItemRowProps {
  row: DraftRow;
  categories: Category[];
  descriptionPlaceholder?: string;
  monthConstraint?: number;
  yearConstraint: number;
  autoFocus?: boolean;
  focused?: boolean;
  onFocus?: () => void;
  onPatch: (patch: Partial<DraftRow>) => void;
  onBlurOutside: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onAddCategoryRequest?: () => void;
  onAdvancedModeRequest?: () => void;
}

type FieldKey = 'description' | 'categoryId' | 'amount' | 'date';

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-4 py-2.5 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

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

export default function BudgetItemRow({
  row,
  categories,
  descriptionPlaceholder = 'לדוגמה: סופר',
  monthConstraint,
  yearConstraint,
  autoFocus = false,
  focused = false,
  onFocus,
  onPatch,
  onBlurOutside,
  onRemove,
  onRetry,
  onAddCategoryRequest,
  onAdvancedModeRequest,
}: BudgetItemRowProps) {
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

  const handleRowFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!onFocus) return;
    const previous = e.relatedTarget as Node | null;
    if (rowRef.current && previous && rowRef.current.contains(previous)) {
      return;
    }
    onFocus();
  };

  const handleRowMouseDown = () => {
    onFocus?.();
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

  return (
    <motion.div
      ref={rowRef}
      onBlur={handleRowBlur}
      onFocus={handleRowFocus}
      onMouseDown={handleRowMouseDown}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`p-2 md:p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
        focused
          ? 'bg-slate-50/80 border-accent/30 shadow-sm'
          : row.needsReview
            ? 'border-transparent bg-amber-50/60 hover:bg-amber-50/80'
            : 'border-transparent hover:bg-slate-50/50'
      }`}
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
            placeholder={descriptionPlaceholder}
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
          <CategoryCombobox
            value={row.categoryId}
            categories={categories}
            invalid={Boolean(errorFor('categoryId'))}
            onChange={(categoryId) => {
              setTouched((t) => ({ ...t, categoryId: true }));
              onPatch({ categoryId });
            }}
            onBlurOutside={() =>
              setTouched((t) => ({ ...t, categoryId: true }))
            }
            onAddCategoryRequest={onAddCategoryRequest}
          />
          {errorFor('categoryId') && (
            <p className="body-text-sm text-red-500 mt-1">
              {errorFor('categoryId')}
            </p>
          )}
        </div>

        <div>
          <label className="label-text mb-1 block md:hidden">סכום</label>
          <div className="flex items-stretch gap-1">
            {/* Currency selector */}
            <select
              value={row.currency ?? CurrencyCode.ILS}
              onChange={(e) => onPatch({ currency: e.target.value as CurrencyCode })}
              aria-label="מטבע"
              title="בחר מטבע"
              className="bg-background/60 border border-slate-200 rounded-xl px-2 py-2.5 text-primary focus:outline-none focus:border-accent transition-all duration-200 text-sm shrink-0 cursor-pointer"
            >
              <option value={CurrencyCode.ILS}>₪</option>
              <option value={CurrencyCode.USD}>$</option>
              <option value={CurrencyCode.EUR}>€</option>
              <option value={CurrencyCode.GBP}>£</option>
            </select>
            <div className="flex-1 min-w-0">
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
            </div>
          </div>
          {/* TODO: add "converted to ILS" hint here once a client-side exchange-rate endpoint is available */}
          {(row.currency && row.currency !== CurrencyCode.ILS) && (
            <p className="body-text-sm text-slate-400 mt-1">
              סכום ב-{row.currency} — המרה ל-₪ בקרוב
            </p>
          )}
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
          {/* "הזכר לי מאוחר יותר" toggle */}
          <button
            type="button"
            onClick={() => onPatch({ needsReview: !row.needsReview })}
            aria-pressed={row.needsReview}
            aria-label={row.needsReview ? 'הסר סימון לבדיקה' : 'סמן לבדיקה מאוחר יותר'}
            title={row.needsReview ? 'מסומן לבדיקה — לחץ לביטול' : 'הזכר לי מאוחר יותר'}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              row.needsReview
                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
          >
            <Bell size={18} strokeWidth={ICON_STROKE} className={row.needsReview ? 'fill-amber-200' : ''} />
          </button>

          {/* יעד שלנו popover */}
          <TargetPopover
            targetAmount={row.targetAmount}
            onSave={(value) => onPatch({ targetAmount: value })}
          />

          {onAdvancedModeRequest && row.serverId === null && (
            <button
              type="button"
              onClick={onAdvancedModeRequest}
              aria-label={
                row.mode === 'recurring'
                  ? 'תחום קבוע'
                  : row.mode === 'installments' && row.installmentsTotal
                    ? `${row.installmentsTotal} תשלומים`
                    : 'הגדר מצב מתקדם'
              }
              title={
                row.mode === 'recurring'
                  ? 'תחום קבוע'
                  : row.mode === 'installments' && row.installmentsTotal
                    ? `${row.installmentsTotal} תשלומים`
                    : 'הגדר מצב מתקדם'
              }
              className={`p-2 rounded-lg transition-colors duration-200 flex items-center gap-1 ${
                row.mode !== 'none'
                  ? 'text-accent bg-accent/10 hover:bg-accent/20'
                  : 'text-slate-400 hover:text-accent hover:bg-slate-100'
              }`}
            >
              {row.mode === 'recurring' ? (
                <>
                  <Repeat size={18} strokeWidth={ICON_STROKE} />
                  <span className="body-text-sm font-semibold">קבוע</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} strokeWidth={ICON_STROKE} />
                  {row.mode === 'installments' && row.installmentsTotal ? (
                    <span className="body-text-sm font-semibold">
                      {row.installmentsTotal}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          )}
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
