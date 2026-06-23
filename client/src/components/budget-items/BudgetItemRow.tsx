import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, ChevronDown, CreditCard, Repeat, Trash2, X } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { CurrencyCode } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import { getCategoryVisual } from '../../data/category-visuals.constants';
import CategoryCombobox from './CategoryCombobox';
import SaveIndicator from './SaveIndicator';
import TargetPopover from './TargetPopover';
import type { DraftRow, InstallmentScheduleEntry } from './types';

const CURRENCY_ISO: Record<CurrencyCode, string> = {
  [CurrencyCode.ILS]: 'ILS',
  [CurrencyCode.USD]: 'USD',
  [CurrencyCode.EUR]: 'EUR',
  [CurrencyCode.GBP]: 'GBP',
};

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  [CurrencyCode.ILS]: '₪',
  [CurrencyCode.USD]: '$',
  [CurrencyCode.EUR]: '€',
  [CurrencyCode.GBP]: '£',
};

function formatCurrency(amount: string, currency: CurrencyCode): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) return amount;
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: CURRENCY_ISO[currency] ?? 'ILS',
    maximumFractionDigits: 0,
  }).format(num);
}

const HEBREW_MONTHS_SELECT = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const formatMonthYear = (isoDate: string): string => {
  const [year, month] = isoDate.slice(0, 10).split('-').map(Number);
  const name = HEBREW_MONTHS_SELECT[(month ?? 1) - 1] ?? '';
  return `${name} ${year}`;
};

interface BudgetItemRowProps {
  row: DraftRow;
  categories: Category[];
  descriptionPlaceholder?: string;
  monthConstraint?: number;
  yearConstraint: number;
  isYearly?: boolean;
  isBiMonthlySection?: boolean;
  autoFocus?: boolean;
  focused?: boolean;
  onFocus?: () => void;
  onPatch: (patch: Partial<DraftRow>) => void;
  onBlurOutside: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onAddCategoryRequest?: () => void;
  onAdvancedModeRequest?: () => void;
  advancedModeOpen?: boolean;
  categoryMode?: 'combobox' | 'label';
}

type FieldKey = 'description' | 'categoryId' | 'amount' | 'month';

const INPUT_CLASS =
  'w-full bg-background/60 border border-slate-200 rounded-xl px-4 py-2.5 text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:bg-surface transition-all duration-200';

const TEXT_INPUT_CLASS =
  'w-full border-0 border-transparent bg-transparent outline-none body-text text-primary placeholder:text-slate-300 cursor-text';

const validateField = (
  key: FieldKey,
  row: DraftRow,
  _yearConstraint: number,
  _monthConstraint?: number,
  isYearly?: boolean,
  isBiMonthlySection?: boolean,
): string | null => {
  switch (key) {
    case 'description':
      return row.description.trim().length > 0 ? null : 'תיאור חובה';
    case 'categoryId':
      return row.categoryId ? null : 'קטגוריה חובה';
    case 'amount': {
      const num = Number(row.amount);
      return Number.isFinite(num) && num > 0 ? null : 'סכום חייב להיות גדול מ-0';
    }
    case 'month': {
      if (isBiMonthlySection) return row.baseMonth ? null : 'בחר חודש בסיס';
      if (isYearly && row.isOneTime) return row.assignedMonth ? null : 'בחר חודש';
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
  isYearly = false,
  isBiMonthlySection = false,
  autoFocus = false,
  focused = false,
  onFocus,
  onPatch,
  onBlurOutside,
  onRemove,
  onRetry,
  onAddCategoryRequest,
  onAdvancedModeRequest,
  advancedModeOpen = false,
  categoryMode = 'combobox',
}: BudgetItemRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLInputElement | null>(null);

  // New rows (unsaved) start in edit mode; saved rows start in view mode.
  const [isFocused, setIsFocused] = useState(() => row.serverId === null);
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    description: false, categoryId: false, amount: false, month: false,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [installmentsExpanded, setInstallmentsExpanded] = useState(false);

  const assignedCategory = categories.find((c) => c.id === row.categoryId) ?? null;
  const assignedCategoryName = assignedCategory?.name ?? null;
  const parentCategory = assignedCategory?.parentCategoryId
    ? categories.find((c) => c.id === assignedCategory.parentCategoryId) ?? null
    : null;
  const tagParentName = parentCategory?.name ?? assignedCategoryName;
  const tagChildName = parentCategory ? assignedCategoryName : null;
  const colorCategoryName = parentCategory?.name ?? assignedCategoryName ?? '';

  // Focus description when a new row mounts in edit mode.
  useEffect(() => {
    if (autoFocus && descriptionRef.current) {
      descriptionRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!confirmingDelete) return;
    const t = window.setTimeout(() => setConfirmingDelete(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmingDelete]);

  const handleRowBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (advancedModeOpen) return;
    const nextFocus = e.relatedTarget as Node | null;
    if (rowRef.current && nextFocus && rowRef.current.contains(nextFocus)) return;
    setIsFocused(false);
    onBlurOutside();
  };

  const handleRowFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const previous = e.relatedTarget as Node | null;
    if (rowRef.current && previous && rowRef.current.contains(previous)) return;
    setIsFocused(true);
    onFocus?.();
  };

  const handleRowMouseDown = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleDeleteClick = () => {
    if (row.serverId === null) { onRemove(); return; }
    if (confirmingDelete) { onRemove(); } else { setConfirmingDelete(true); }
  };

  const errorFor = (key: FieldKey): string | null =>
    touched[key]
      ? validateField(key, row, yearConstraint, monthConstraint, isYearly, isBiMonthlySection)
      : null;

  const fieldClass = (key: FieldKey): string =>
    errorFor(key) ? `${INPUT_CLASS} border-red-300 focus:border-red-400` : INPUT_CLASS;

  const hasScheduleColumn = isYearly || isBiMonthlySection;
  const gridTemplate =
    categoryMode === 'label'
      ? hasScheduleColumn
        ? 'md:grid-cols-[1.2fr_2fr_1fr_1fr_auto]'
        : 'md:grid-cols-[1.2fr_2fr_1fr_auto]'
      : hasScheduleColumn
        ? 'md:grid-cols-[2fr_1.5fr_1fr_1fr_auto]'
        : 'md:grid-cols-[2fr_1.5fr_1fr_auto]';

  // Formatted amount for view mode display
  const formattedAmount = (() => {
    const num = parseFloat(row.amount);
    if (!Number.isFinite(num) || num <= 0) return '—';
    return formatCurrency(row.amount, row.currency ?? CurrencyCode.ILS);
  })();

  // Schedule text for view mode
  const scheduleDisplayText = (() => {
    if (isYearly) {
      if (row.isOneTime) return row.assignedMonth ? HEBREW_MONTHS_SELECT[row.assignedMonth - 1] : '—';
      if (row.assignedMonth === null) return 'פריסה שנתית';
      return HEBREW_MONTHS_SELECT[row.assignedMonth - 1] ?? '—';
    }
    if (row.baseMonth) return row.baseMonth % 2 === 0 ? 'זוגי' : 'אי-זוגי';
    return '—';
  })();

  // ── Installment read-only branch ──────────────────────────────────────────
  if (row.installmentSchedule && row.installmentSchedule.length > 0) {
    const schedule: InstallmentScheduleEntry[] = row.installmentSchedule;
    const current = schedule.find((e) => e.isCurrent) ?? schedule[0];
    const totalSum = schedule.reduce((acc, e) => acc + parseFloat(e.amount), 0).toFixed(2);
    const firstCurrency = schedule[0].currency;
    const visual = getCategoryVisual(colorCategoryName);

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
        className={`px-4 py-3 rounded-xl border border-transparent transition-all duration-200 cursor-pointer group hover:bg-slate-50/70 hover:border-slate-100`}
      >
        <div className={`grid grid-cols-1 gap-3 ${gridTemplate} md:gap-4 md:items-center`}>
          {/* Category tag */}
          <div>
            <span
              className="inline-flex flex-col items-start gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg border leading-tight text-right"
              style={assignedCategoryName ? { color: visual.color, backgroundColor: `${visual.color}1A`, borderColor: `${visual.color}40` } : undefined}
            >
              {assignedCategoryName ? (
                <>
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: visual.color }} />
                    {tagParentName}
                  </span>
                  {tagChildName && <span className="opacity-80 pr-2.5">{`> ${tagChildName}`}</span>}
                </>
              ) : <span className="text-slate-400">ללא קטגוריה</span>}
            </span>
          </div>
          {/* Description + installment badge */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="body-text text-primary truncate">{row.description}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent whitespace-nowrap shrink-0">
              {'תשלום '}<span dir="ltr">{current.index}/{current.total}</span>
            </span>
          </div>
          {/* Amount */}
          <div>
            <span dir="ltr" className="body-text font-semibold tabular-nums text-primary">
              {formatCurrency(current.amount, current.currency)}
            </span>
          </div>
          {/* Actions */}
          <div className="flex items-center justify-end gap-1">
            <button type="button" onClick={() => setInstallmentsExpanded((v) => !v)}
              aria-label={installmentsExpanded ? 'הסתר פירוט תשלומים' : 'הצג פירוט תשלומים'}
              aria-expanded={installmentsExpanded}
              className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-slate-100 transition-colors duration-200">
              <ChevronDown size={18} strokeWidth={ICON_STROKE} className={`transition-transform duration-200 ${installmentsExpanded ? '' : '-rotate-90'}`} />
            </button>
            <SaveIndicator status={row.status} errorMessage={row.errorMessage} onRetry={onRetry} />
            <AnimatePresence mode="wait" initial={false}>
              {confirmingDelete ? (
                <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }} className="flex items-center gap-1">
                  <button type="button" onClick={handleDeleteClick} className="bg-red-500 text-white px-3 py-1.5 rounded-lg label-text hover:bg-red-600 transition-colors duration-200" aria-label="אישור מחיקה">מחק</button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors duration-200" aria-label="ביטול מחיקה"><X size={16} strokeWidth={ICON_STROKE} /></button>
                </motion.div>
              ) : (
                <motion.button key="trash" type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={handleDeleteClick} aria-label="מחיקת שורה" className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <Trash2 size={18} strokeWidth={ICON_STROKE} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {installmentsExpanded && (
            <motion.div key="breakdown" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
              <div className="mt-2 border-t border-slate-100 pt-2 bg-slate-50/60 rounded-xl px-3 py-2 space-y-1">
                {schedule.map((e) => (
                  <div key={e.serverId || `${e.index}`} className={`flex items-center justify-between gap-3 text-xs ${e.isCurrent ? 'text-accent font-semibold' : 'text-slate-600'}`}>
                    <span>{row.description}{' – '}{'תשלום '}<span dir="ltr">{e.index}/{e.total}</span></span>
                    <span dir="ltr" className="font-semibold tabular-nums shrink-0">{formatCurrency(e.amount, e.currency)}</span>
                    <span dir="ltr" className="text-slate-400 tabular-nums shrink-0">{e.month}.{String(e.year).slice(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 text-xs font-bold border-t border-slate-200 pt-2 mt-1">
                  <span>{'סכום כולל'}</span>
                  <span dir="ltr" className="tabular-nums">{formatCurrency(totalSum, firstCurrency)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  const visual = getCategoryVisual(colorCategoryName);

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
      className={`transition-all duration-200 cursor-pointer group ${
        isFocused
          ? `p-2 md:p-3 rounded-2xl border-2 ${
              row.needsReview
                ? 'bg-amber-50/60 border-amber-200/60'
                : focused
                  ? 'bg-slate-50/80 border-accent/30 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200'
            }`
          : `px-4 py-3 rounded-xl border border-transparent ${
              row.needsReview
                ? 'bg-amber-50/50 hover:bg-amber-50/80'
                : 'hover:bg-slate-50/70 hover:border-slate-100'
            }`
      }`}
    >
      <div className={`grid grid-cols-1 gap-3 ${gridTemplate} md:gap-4 ${isFocused ? 'md:items-start' : 'md:items-center'}`}>

        {/* ── Category column (label-mode) ── */}
        {categoryMode === 'label' && (
          <div>
            {isFocused && <label className="label-text mb-1 block md:hidden">קטגוריה</label>}
            {editingCategory ? (
              <CategoryCombobox
                value={row.categoryId}
                categories={categories}
                invalid={Boolean(errorFor('categoryId'))}
                autoOpen={true}
                onChange={(categoryId) => {
                  setTouched((t) => ({ ...t, categoryId: true }));
                  onPatch({ categoryId });
                  setEditingCategory(false);
                }}
                onBlurOutside={() => {
                  setTouched((t) => ({ ...t, categoryId: true }));
                  setEditingCategory(false);
                }}
                onAddCategoryRequest={onAddCategoryRequest}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditingCategory(true)}
                  aria-label={assignedCategoryName ? `קטגוריה: ${assignedCategoryName}` : 'בחר קטגוריה'}
                  className="inline-flex flex-col items-start gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg border leading-tight text-right transition-all duration-200 hover:opacity-80"
                  style={
                    assignedCategoryName
                      ? { color: visual.color, backgroundColor: `${visual.color}1A`, borderColor: `${visual.color}40` }
                      : undefined
                  }
                >
                  {assignedCategoryName ? (
                    <>
                      <span className="flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: visual.color }} />
                        {tagParentName}
                      </span>
                      {tagChildName && <span className="opacity-80 pr-2.5">{`> ${tagChildName}`}</span>}
                    </>
                  ) : (
                    <span className="text-slate-400">בחר קטגוריה</span>
                  )}
                </button>
                {isFocused && errorFor('categoryId') && (
                  <p className="body-text-sm text-red-500 mt-1">{errorFor('categoryId')}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Description column ── */}
        <div>
          {isFocused && <label className="label-text mb-1 block md:hidden">תיאור</label>}
          <input
            ref={descriptionRef}
            type="text"
            value={row.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            placeholder={descriptionPlaceholder}
            aria-label="תיאור"
            className={isFocused ? fieldClass('description') : TEXT_INPUT_CLASS}
          />
          {isFocused && errorFor('description') && (
            <p className="body-text-sm text-red-500 mt-1">{errorFor('description')}</p>
          )}
          {/* Advanced-mode markers for saved rows */}
          {row.serverId !== null && (row.baseMonth !== null || row.endDate !== null) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {row.baseMonth !== null && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                  <Repeat size={12} strokeWidth={ICON_STROKE} />
                  {row.baseMonth % 2 === 0 ? 'דו-חודשי · זוגי' : 'דו-חודשי · אי-זוגי'}
                </span>
              )}
              {row.endDate !== null && row.baseMonth === null && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                  <CalendarClock size={12} strokeWidth={ICON_STROKE} />
                  <span>חיוב אחרון</span>
                  <span dir="ltr">{formatMonthYear(row.endDate)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Category column (combobox-mode) ── */}
        {categoryMode === 'combobox' && (
          <div>
            {isFocused && <label className="label-text mb-1 block md:hidden">קטגוריה</label>}
            {isFocused ? (
              <>
                <CategoryCombobox
                  value={row.categoryId}
                  categories={categories}
                  invalid={Boolean(errorFor('categoryId'))}
                  onChange={(categoryId) => {
                    setTouched((t) => ({ ...t, categoryId: true }));
                    onPatch({ categoryId });
                  }}
                  onBlurOutside={() => setTouched((t) => ({ ...t, categoryId: true }))}
                  onAddCategoryRequest={onAddCategoryRequest}
                />
                {errorFor('categoryId') && (
                  <p className="body-text-sm text-red-500 mt-1">{errorFor('categoryId')}</p>
                )}
              </>
            ) : (
              <span className="body-text-sm text-slate-500">
                {assignedCategoryName ?? <span className="text-slate-300 italic">ללא קטגוריה</span>}
              </span>
            )}
          </div>
        )}

        {/* ── Amount column ── */}
        <div>
          {isFocused && <label className="label-text mb-1 block md:hidden">סכום</label>}
          {isFocused ? (
            <>
              <div className="flex items-stretch gap-1">
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
              {row.currency && row.currency !== CurrencyCode.ILS && (
                <p className="body-text-sm text-slate-400 mt-1">סכום ב-{row.currency} — המרה ל-₪ בקרוב</p>
              )}
              {errorFor('amount') && (
                <p className="body-text-sm text-red-500 mt-1">{errorFor('amount')}</p>
              )}
            </>
          ) : (
            <span dir="ltr" className={`body-text font-semibold tabular-nums ${!row.amount || Number(row.amount) <= 0 ? 'text-slate-300' : 'text-primary'}`}>
              {formattedAmount}
              {row.currency && row.currency !== CurrencyCode.ILS && (
                <span className="text-xs text-slate-400 mr-1">{CURRENCY_SYMBOL[row.currency]}</span>
              )}
            </span>
          )}
        </div>

        {/* ── Schedule column ── */}
        {hasScheduleColumn && (
          <div>
            {isFocused ? (
              isYearly ? (
                <>
                  <label className="label-text mb-1 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.isOneTime}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onPatch({ isOneTime: checked, assignedMonth: checked ? row.assignedMonth ?? new Date().getMonth() + 1 : row.assignedMonth });
                        setTouched((t) => ({ ...t, month: true }));
                      }}
                      aria-label="פריט חד-פעמי"
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                    <span className="label-text hidden md:inline">חד-פעמי</span>
                  </label>
                  {row.isOneTime ? (
                    <>
                      <select
                        value={row.assignedMonth ?? ''}
                        onChange={(e) => { onPatch({ assignedMonth: e.target.value ? Number(e.target.value) : null }); setTouched((t) => ({ ...t, month: true })); }}
                        aria-label="חודש"
                        className={`${fieldClass('month')} cursor-pointer appearance-none`}
                      >
                        <option value="">בחר חודש</option>
                        {HEBREW_MONTHS_SELECT.map((label, idx) => <option key={label} value={idx + 1}>{label}</option>)}
                      </select>
                      {errorFor('month') && <p className="body-text-sm text-red-500 mt-1">{errorFor('month')}</p>}
                    </>
                  ) : (
                    <>
                      <select
                        value={row.assignedMonth ?? 'spread'}
                        onChange={(e) => { const val = e.target.value; onPatch({ assignedMonth: val === 'spread' ? null : Number(val) }); }}
                        aria-label="חודש שיוך"
                        className={`${INPUT_CLASS} cursor-pointer appearance-none`}
                      >
                        <option value="spread">פריסה ל-12 חודשים</option>
                        {HEBREW_MONTHS_SELECT.map((label, idx) => <option key={label} value={idx + 1}>{label}</option>)}
                      </select>
                      {row.assignedMonth === null ? (
                        <p className="body-text-sm text-accent mt-1">
                          נפרס ל-12 חודשים
                          {row.amount && Number(row.amount) > 0 && (
                            <span className="text-slate-400 mr-1">
                              ({new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(Number(row.amount) / 12)}/חודש)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="body-text-sm text-slate-400 mt-1">{HEBREW_MONTHS_SELECT[row.assignedMonth - 1]}</p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <label className="label-text mb-1 block md:hidden">חודש בסיס</label>
                  <select
                    value={row.baseMonth ?? ''}
                    onChange={(e) => { setTouched((t) => ({ ...t, month: true })); onPatch({ baseMonth: e.target.value ? Number(e.target.value) : null }); }}
                    aria-label="חודש בסיס"
                    className={`${INPUT_CLASS} cursor-pointer appearance-none`}
                  >
                    <option value="">בחר חודש בסיס</option>
                    {HEBREW_MONTHS_SELECT.map((label, idx) => <option key={label} value={idx + 1}>{label}</option>)}
                  </select>
                  {row.baseMonth ? (
                    <p className="body-text-sm text-accent mt-1">
                      {row.baseMonth % 2 === 0 ? 'יחויב בחודשים זוגיים' : 'יחויב בחודשים אי-זוגיים'}
                    </p>
                  ) : null}
                  {errorFor('month') && <p className="body-text-sm text-red-500 mt-1">{errorFor('month')}</p>}
                </>
              )
            ) : (
              <span className="body-text-sm text-slate-500">{scheduleDisplayText}</span>
            )}
          </div>
        )}

        {/* ── Actions column ── */}
        <div className="flex items-center justify-end gap-2 md:pt-1">
          {isFocused && (
            <TargetPopover
              targetAmount={row.targetAmount}
              onSave={(value) => onPatch({ targetAmount: value })}
            />
          )}

          {isFocused && onAdvancedModeRequest && row.serverId === null && (
            <button
              type="button"
              onClick={onAdvancedModeRequest}
              aria-label={
                row.mode === 'recurring' ? 'תחום קבוע'
                  : row.mode === 'lastMonth' && row.endDate ? `חיוב אחרון ${formatMonthYear(row.endDate)}`
                    : row.mode === 'installments' && row.installmentsTotal ? `${row.installmentsTotal} תשלומים`
                      : 'הגדר מצב מתקדם'
              }
              className={`p-2 rounded-lg transition-colors duration-200 flex items-center gap-1 ${
                row.mode !== 'none' ? 'text-accent bg-accent/10 hover:bg-accent/20' : 'text-slate-400 hover:text-accent hover:bg-slate-100'
              }`}
            >
              {row.mode === 'recurring' ? (
                <><Repeat size={18} strokeWidth={ICON_STROKE} /><span className="body-text-sm font-semibold">קבוע</span></>
              ) : row.mode === 'lastMonth' && row.endDate ? (
                <><CalendarClock size={18} strokeWidth={ICON_STROKE} /><span className="body-text-sm font-semibold">{formatMonthYear(row.endDate)}</span></>
              ) : (
                <><CreditCard size={18} strokeWidth={ICON_STROKE} />{row.mode === 'installments' && row.installmentsTotal ? <span className="body-text-sm font-semibold">{row.installmentsTotal}</span> : null}</>
              )}
            </button>
          )}

          <SaveIndicator status={row.status} errorMessage={row.errorMessage} onRetry={onRetry} />

          <AnimatePresence mode="wait" initial={false}>
            {confirmingDelete ? (
              <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }} className="flex items-center gap-1">
                <button type="button" onClick={handleDeleteClick} className="bg-red-500 text-white px-3 py-1.5 rounded-lg label-text hover:bg-red-600 transition-colors duration-200" aria-label="אישור מחיקה">מחק</button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors duration-200" aria-label="ביטול מחיקה"><X size={16} strokeWidth={ICON_STROKE} /></button>
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
                className={`p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 ${
                  !isFocused ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                }`}
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
  isYearly?: boolean,
  isBiMonthlySection?: boolean,
): boolean =>
  (['description', 'categoryId', 'amount', 'month'] as FieldKey[]).every(
    (key) => validateField(key, row, yearConstraint, monthConstraint, isYearly, isBiMonthlySection) === null,
  );
