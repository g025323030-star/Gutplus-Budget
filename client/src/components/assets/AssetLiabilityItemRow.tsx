import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Trash2, X, Check, Loader2, Percent, Target, CalendarDays, Info, ChevronDown,
} from 'lucide-react';
import { AssetLiabilityCategory, AssetSide, CurrencyCode, FamilyMemberRole } from '@gutplus/shared';
import type { AssetLiabilityItem, FamilyMember } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import {
  createAssetLiabilityItem,
  updateAssetLiabilityItem,
} from '../../services/asset-liability-items.service';
import TargetPopover from '../budget-items/TargetPopover';
import InterestRatePopover from './InterestRatePopover';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './category-visuals';
import type { AssetLiabilitySide } from './AssetLiabilityToggle';

export const PENDING_PREFIX = '__pending__';
export const NEW_ROW_ID = '__new__';
/** Any synthetic (non-DB) ID — covers both __new__ and __pending__... */
export const isPendingId = (id: string) => id.startsWith('__');

const FAMILY_MEMBER_ROLE_LABELS: Record<FamilyMemberRole, string> = {
  [FamilyMemberRole.Parent]: 'הורה',
  [FamilyMemberRole.Child]: 'ילד/ה',
};

const URGENCY_OPTIONS = [
  { level: 1, label: 'נמוכה', color: 'bg-green-500' },
  { level: 2, label: 'בינונית', color: 'bg-yellow-400' },
  { level: 3, label: 'גבוהה', color: 'bg-red-500' },
];
const URGENCY_COLORS: Record<number, string> = { 1: 'bg-green-500', 2: 'bg-yellow-400', 3: 'bg-red-500' };

function CategoryTag({ category, isLinkedDebt }: { category: AssetLiabilityCategory; isLinkedDebt: boolean }) {
  if (isLinkedDebt) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border leading-tight shrink-0 text-red-500 bg-red-50 border-red-200">
        ● חוב (הוצאות)
      </span>
    );
  }
  const color = CATEGORY_COLORS[category];
  return (
    <span
      style={{ color, backgroundColor: `${color}1A`, borderColor: `${color}40` }}
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border leading-tight shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function CategoryChips({ value, onChange }: { value: AssetLiabilityCategory; onChange: (c: AssetLiabilityCategory) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.values(AssetLiabilityCategory).map((cat) => {
        const color = CATEGORY_COLORS[cat];
        const sel = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            style={sel ? { color: '#fff', backgroundColor: color, borderColor: color } : { color, backgroundColor: `${color}1A`, borderColor: `${color}40` }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border leading-tight transition-all duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sel ? '#fff' : color }} />
            {CATEGORY_LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
}

const fmtCurrency = (val: number, currency = 'ILS') =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);

interface AssetLiabilityItemRowProps {
  item: AssetLiabilityItem;
  side: AssetLiabilitySide;
  familyMembers: FamilyMember[];
  householdId: string;
  isEditing: boolean;
  defaultCategory?: AssetLiabilityCategory;
  onEditRequest: () => void;
  onSaved: (item: AssetLiabilityItem) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onItemUpdated: (item: AssetLiabilityItem) => void;
}

export default function AssetLiabilityItemRow({
  item,
  side,
  familyMembers,
  householdId,
  isEditing,
  defaultCategory,
  onEditRequest,
  onSaved,
  onCancel,
  onDelete,
  onItemUpdated,
}: AssetLiabilityItemRowProps) {
  const isPending = isPendingId(item.id);
  /** A debt item imported from Expenses that doesn't exist in the DB yet. */
  const isPendingDebt = isPending && item.id !== NEW_ROW_ID;
  const isLinkedDebt = !!item.sourceBudgetItemId;
  const sideEnum = side === 'assets' ? AssetSide.ASSET : AssetSide.LIABILITY;

  // ── Edit-mode draft state ──────────────────────────────────────────────────
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<AssetLiabilityCategory>(
    item.category ?? defaultCategory ?? AssetLiabilityCategory.REAL_ESTATE,
  );
  const [value, setValue] = useState(isPending ? '' : item.value);
  const [currency, setCurrency] = useState<CurrencyCode>(item.currency ?? CurrencyCode.ILS);
  const [monthlyPayment, setMonthlyPayment] = useState(item.monthlyPayment ?? '');
  const [interestRate, setInterestRate] = useState(item.interestRate ?? '');
  const [targetAmount, setTargetAmount] = useState(item.targetAmount ?? '');
  const [familyMemberId, setFamilyMemberId] = useState(item.familyMemberId ?? '');
  const [urgencyLevel, setUrgencyLevel] = useState<number | null>(item.urgencyLevel);

  // Monthly payment → Expenses sync state
  const [syncConfirmed, setSyncConfirmed] = useState(false);
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Sync draft when entering edit
  useEffect(() => {
    if (isEditing) {
      setName(item.name);
      setCategory(item.category ?? defaultCategory ?? AssetLiabilityCategory.REAL_ESTATE);
      setValue(isPending ? '' : item.value);
      setCurrency(item.currency ?? CurrencyCode.ILS);
      setMonthlyPayment(item.monthlyPayment ?? '');
      setInterestRate(item.interestRate ?? '');
      setTargetAmount(item.targetAmount ?? '');
      setFamilyMemberId(item.familyMemberId ?? '');
      setUrgencyLevel(item.urgencyLevel);
      setSyncConfirmed(false);
      setExpenseEndDate('');
      setShowSyncPanel(false);
      setError(null);
    }
  }, [isEditing]);

  const handleMonthlyPaymentChange = (val: string) => {
    setMonthlyPayment(val);
    if (val && Number(val) > 0 && !isLinkedDebt) {
      setShowSyncPanel(true);
      setSyncConfirmed(false);
    } else {
      setShowSyncPanel(false);
      setSyncConfirmed(false);
    }
  };

  const handleSyncConfirm = () => { setSyncConfirmed(true); setShowSyncPanel(false); };
  const handleSyncCancel = () => {
    setMonthlyPayment('');
    setSyncConfirmed(false);
    setShowSyncPanel(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('נא להזין שם / תיאור'); return; }
    if (!value || isNaN(Number(value)) || Number(value) < 0) { setError('נא להזין שווי תקין'); return; }
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        side: sideEnum,
        category,
        value,
        currency,
        interestRate: interestRate.trim() || null,
        targetAmount: targetAmount.trim() || null,
        urgencyLevel,
        monthlyPayment: monthlyPayment.trim() || null,
        familyMemberId: familyMemberId || null,
        sourceBudgetItemId: item.sourceBudgetItemId || null,
        lastDecreaseYearMonth: item.lastDecreaseYearMonth || null,
      };

      let saved: AssetLiabilityItem;
      if (isPending) {
        saved = await createAssetLiabilityItem({
          ...payload,
          householdId,
          syncToExpenses: syncConfirmed,
          expenseEndDate: syncConfirmed ? (expenseEndDate || null) : null,
        });
      } else {
        saved = await updateAssetLiabilityItem(item.id, payload);
      }
      onSaved(saved);
    } catch {
      setError('שמירה נכשלה. נסו שוב');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTargetSavePopover = async (val: string | null) => {
    if (isPending) return;
    try {
      const updated = await updateAssetLiabilityItem(item.id, { targetAmount: val });
      onItemUpdated(updated);
    } catch { /* silently ignore */ }
  };

  const handleInterestSavePopover = async (val: string | null) => {
    if (isPending) return;
    try {
      const updated = await updateAssetLiabilityItem(item.id, { interestRate: val });
      onItemUpdated(updated);
    } catch { /* silently ignore */ }
  };

  // ── EDIT MODE ───────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-2xl border-2 border-accent/30 bg-slate-50/80 shadow-sm space-y-3"
      >
        {/* Category chips */}
        {!isLinkedDebt && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">קטגוריה</p>
            <CategoryChips value={category} onChange={setCategory} />
          </div>
        )}

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם / תיאור"
          autoFocus
          disabled={isSaving}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
        />

        {/* Value + currency */}
        <div className="grid grid-cols-[2fr_auto] gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="יתרה / שווי (קרן)"
            disabled={isSaving}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            disabled={isSaving}
            className="px-2 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent"
          >
            {Object.values(CurrencyCode).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Monthly Payment */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-1.5">תשלום חודשי</p>
          {isLinkedDebt ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={monthlyPayment}
                readOnly
                className="flex-1 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-sm text-right cursor-not-allowed"
              />
              <span className="text-xs text-accent bg-accent/10 px-2 py-1.5 rounded-lg whitespace-nowrap">מסונכרן להוצאות</span>
            </div>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyPayment}
                onChange={(e) => handleMonthlyPaymentChange(e.target.value)}
                placeholder="סכום תשלום חודשי (אופציונלי)"
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
              />

              {/* Expenses sync confirmation panel */}
              <AnimatePresence>
                {showSyncPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                      <div className="flex items-start gap-2">
                        <Info size={14} strokeWidth={ICON_STROKE} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">הגדרת תשלום חודשי תוסיף רשומה חוזרת אוטומטית לדף ההוצאות</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={13} strokeWidth={ICON_STROKE} className="text-slate-400 shrink-0" />
                        <input
                          type="date"
                          value={expenseEndDate}
                          onChange={(e) => setExpenseEndDate(e.target.value)}
                          placeholder="תאריך סיום (אופציונלי)"
                          className="flex-1 px-2 py-1 rounded-lg border border-blue-200 bg-white text-primary text-xs focus:outline-none focus:border-blue-400 transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSyncConfirm}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                          <Check size={12} strokeWidth={2} />
                          אישור — הוסף להוצאות
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncCancel}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs hover:border-slate-300 transition-colors"
                        >
                          <X size={12} strokeWidth={2} />
                          בטל תשלום חודשי
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {syncConfirmed && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Check size={11} strokeWidth={2} />
                  עם השמירה תיווצר רשומה חוזרת בדף ההוצאות
                </p>
              )}
            </>
          )}
        </div>

        {/* Interest Rate + Target Amount */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
              <Percent size={13} className="text-slate-400" strokeWidth={ICON_STROKE} />
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="ריבית שנתית (%)"
              disabled={isSaving}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
            />
          </div>
          <div className="relative">
            <span className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
              <Target size={13} className="text-slate-400" strokeWidth={ICON_STROKE} />
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="יעד / מטרה (₪)"
              disabled={isSaving}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
            />
          </div>
        </div>

        {/* Family member + Urgency */}
        <div className="flex flex-wrap items-center gap-2">
          {familyMembers.length > 0 && (
            <select
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              disabled={isSaving}
              className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
            >
              <option value="">ללא שיוך לבן משפחה</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({FAMILY_MEMBER_ROLE_LABELS[m.role]})
                </option>
              ))}
            </select>
          )}
          {side === 'liabilities' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 whitespace-nowrap">דחיפות:</span>
              {URGENCY_OPTIONS.map(({ level, label, color }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgencyLevel(urgencyLevel === level ? null : level)}
                  disabled={isSaving}
                  title={label}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
                    urgencyLevel === level ? 'border-slate-400 shadow-sm' : 'border-transparent opacity-40 hover:opacity-70'
                  } ${color}`}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Save / Cancel */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:border-slate-300 transition-all"
          >
            <X size={14} strokeWidth={ICON_STROKE} />
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={ICON_STROKE} />
            ) : (
              <Check size={14} strokeWidth={ICON_STROKE} />
            )}
            {isPending ? 'הוסף' : 'שמור'}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── COLLAPSED PENDING DEBT VIEW (not yet editing) ───────────────────────────
  if (isPendingDebt && !isEditing) {
    const monthlyAmt = item.monthlyPayment ? parseFloat(item.monthlyPayment) : 0;
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/30 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
        onClick={onEditRequest}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onEditRequest()}
        aria-label={`הגדר יתרת קרן עבור ${item.name}`}
      >
        <ChevronDown
          size={14}
          strokeWidth={ICON_STROKE}
          className="text-blue-400 shrink-0 -rotate-90 group-hover:rotate-0 transition-transform duration-200"
        />
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border leading-tight shrink-0 text-red-500 bg-red-50 border-red-200">
          ● חוב (הוצאות)
        </span>
        <span className="flex-1 font-semibold text-primary text-sm truncate">{item.name}</span>
        {monthlyAmt > 0 && (
          <span className="text-xs text-slate-500 tabular-nums hidden sm:inline">
            {fmtCurrency(monthlyAmt)}/חודש
          </span>
        )}
        <span className="text-xs text-blue-500 font-medium">לחץ להגדרת יתרה</span>
      </motion.div>
    );
  }

  // ── VIEW MODE ───────────────────────────────────────────────────────────────
  const principal = parseFloat(item.value);
  const monthlyAmt = item.monthlyPayment ? parseFloat(item.monthlyPayment) : 0;
  const targetAmt = item.targetAmount ? parseFloat(item.targetAmount) : principal;
  const showConversion = item.currency !== 'ILS';
  const principalIls = parseFloat(item.valueInIls ?? item.value);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="group px-4 py-3 rounded-xl border border-transparent hover:bg-slate-50/70 hover:border-slate-100 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: urgency + tag + name + meta */}
        <div className="flex items-center gap-2 min-w-0">
          {item.urgencyLevel != null && (
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${URGENCY_COLORS[item.urgencyLevel] ?? 'bg-slate-400'}`}
              title={`דחיפות ${item.urgencyLevel}`}
            />
          )}
          <CategoryTag category={item.category} isLinkedDebt={isLinkedDebt} />
          <div className="min-w-0">
            <p className="font-semibold text-primary text-sm truncate">{item.name}</p>
            <div className="flex flex-wrap items-center gap-x-2">
              {item.familyMemberName && <span className="text-xs text-slate-400">{item.familyMemberName}</span>}
              {item.interestRate && parseFloat(item.interestRate) > 0 && (
                <span className="text-xs text-slate-400">ריבית {item.interestRate}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: value columns + hover icons */}
        <div className="flex items-center gap-3 shrink-0">
          {monthlyAmt > 0 && (
            <div className="text-left hidden sm:block">
              <p className="text-[10px] text-slate-400">חודשי</p>
              <p className="text-sm font-medium text-slate-600 tabular-nums">{fmtCurrency(monthlyAmt)}</p>
            </div>
          )}
          <div className="text-left">
            <p className="text-[10px] text-slate-400">יתרה</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {fmtCurrency(principal, item.currency)}
            </p>
            {showConversion && (
              <p className="text-[10px] text-slate-400 tabular-nums">≈ {fmtCurrency(principalIls)}</p>
            )}
          </div>
          {/* Target: only show if different from principal by more than 1 */}
          {Math.abs(targetAmt - principal) > 1 && (
            <div className="text-left hidden sm:block">
              <p className="text-[10px] text-slate-400">יעד</p>
              <p className="text-sm font-medium text-accent tabular-nums">{fmtCurrency(targetAmt)}</p>
            </div>
          )}

          {/* Hover icons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TargetPopover targetAmount={item.targetAmount} onSave={handleTargetSavePopover} />
            <InterestRatePopover interestRate={item.interestRate} onSave={handleInterestSavePopover} />
            <button
              type="button"
              onClick={onEditRequest}
              aria-label="עריכת פריט"
              className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-slate-100 transition-all duration-200"
            >
              <Pencil size={15} strokeWidth={ICON_STROKE} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {confirmingDelete ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    מחק
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                  >
                    <X size={13} strokeWidth={ICON_STROKE} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="trash"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="מחיקת פריט"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <Trash2 size={15} strokeWidth={ICON_STROKE} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
