import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListPlus, Loader2, ExternalLink, Bell, ChevronDown, Target, Percent } from 'lucide-react';
import { AssetLiabilityCategory, AssetSide, CurrencyCode, FamilyMemberRole } from '@gutplus/shared';
import type { AssetLiabilityItem, FamilyMember } from '@gutplus/shared';
import { Link } from 'react-router-dom';
import { ICON_STROKE } from '../../constants/ui';
import { createAssetLiabilityItem } from '../../services/asset-liability-items.service';
import {
  loadSuggestions,
  loadReminderIds,
  saveReminderIds,
} from '../../data/asset-liability-default-suggestions';
import type { AssetLiabilitySuggestion } from '../../data/asset-liability-default-suggestions';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './category-visuals';

const FAMILY_MEMBER_ROLE_LABELS: Record<FamilyMemberRole, string> = {
  [FamilyMemberRole.Parent]: 'הורה',
  [FamilyMemberRole.Child]: 'ילד/ה',
};

const URGENCY_OPTIONS = [
  { level: 1, label: 'נמוכה', color: 'bg-green-500' },
  { level: 2, label: 'בינונית', color: 'bg-yellow-400' },
  { level: 3, label: 'גבוהה', color: 'bg-red-500' },
];

interface FillRow {
  suggestion: AssetLiabilitySuggestion;
  name: string;
  category: AssetLiabilityCategory;
  value: string;
  currency: CurrencyCode;
  interestRate: string;
  targetAmount: string;
  familyMemberId: string;
  urgencyLevel: number | null;
  expanded: boolean;
  reminded: boolean;
}

function initRow(s: AssetLiabilitySuggestion, reminderIds: string[]): FillRow {
  return {
    suggestion: s,
    name: s.name,
    category: s.category,
    value: '',
    currency: s.currency,
    interestRate: '',
    targetAmount: '',
    familyMemberId: '',
    urgencyLevel: null,
    expanded: false,
    reminded: reminderIds.includes(s.id),
  };
}

interface AssetLiabilityQuickFillModalProps {
  isOpen: boolean;
  householdId: string;
  familyMembers: FamilyMember[];
  onClose: () => void;
  onSaved: (items: AssetLiabilityItem[]) => void;
  onReminderChange?: () => void;
}

function CategoryChips({
  value,
  onChange,
}: {
  value: AssetLiabilityCategory;
  onChange: (c: AssetLiabilityCategory) => void;
}) {
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

function SuggestionRow({
  row,
  isLiability,
  familyMembers,
  onChange,
  onToggleExpand,
  onToggleRemind,
}: {
  row: FillRow;
  isLiability: boolean;
  familyMembers: FamilyMember[];
  onChange: (field: keyof FillRow, val: unknown) => void;
  onToggleExpand: () => void;
  onToggleRemind: () => void;
}) {
  const color = CATEGORY_COLORS[row.category];
  const hasValue = row.value.trim().length > 0 && Number(row.value) > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        row.reminded
          ? 'border-yellow-200 bg-yellow-50/70'
          : hasValue
          ? 'border-accent/30 bg-accent/5'
          : 'border-slate-100 bg-transparent'
      }`}
    >
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleExpand()}
      >
        {/* Expand chevron */}
        <ChevronDown
          size={14}
          strokeWidth={ICON_STROKE}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${row.expanded ? 'rotate-180' : ''}`}
        />

        {/* Category tag */}
        <span
          style={{ color, backgroundColor: `${color}1A`, borderColor: `${color}40` }}
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border leading-tight shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          {CATEGORY_LABELS[row.category]}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-primary truncate">{row.name}</span>

        {/* Compact value input (always visible) */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={row.value}
            onChange={(e) => onChange('value', e.target.value)}
            placeholder="סכום"
            className={`w-24 px-2 py-1 rounded-lg border text-sm text-right focus:outline-none focus:border-accent transition-all ${
              hasValue ? 'border-accent/40 bg-white' : 'border-slate-200 bg-white/80'
            }`}
          />
          <select
            value={row.currency}
            onChange={(e) => onChange('currency', e.target.value)}
            className="px-1.5 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-accent transition-all"
          >
            {Object.values(CurrencyCode).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Bell — remind me later */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleRemind(); }}
          aria-label={row.reminded ? 'הסר תזכורת' : 'הוסף תזכורת'}
          title={row.reminded ? 'הסר תזכורת' : 'תזכיר לי מאוחר יותר'}
          className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 ${
            row.reminded
              ? 'text-yellow-500 bg-yellow-100 hover:bg-yellow-200'
              : 'text-slate-300 hover:text-yellow-400 hover:bg-yellow-50'
          }`}
        >
          {row.reminded ? (
            <Bell size={15} strokeWidth={ICON_STROKE} className="fill-yellow-400" />
          ) : (
            <Bell size={15} strokeWidth={ICON_STROKE} />
          )}
        </button>
      </div>

      {/* Expanded form */}
      <AnimatePresence initial={false}>
        {row.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100/70">
              {/* Category chips */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-1.5">קטגוריה</p>
                <CategoryChips value={row.category} onChange={(c) => onChange('category', c)} />
              </div>

              {/* Name */}
              <input
                type="text"
                value={row.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="שם / תיאור"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
              />

              {/* Interest + Target */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
                    <Percent size={13} className="text-slate-400" strokeWidth={ICON_STROKE} />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.interestRate}
                    onChange={(e) => onChange('interestRate', e.target.value)}
                    placeholder="ריבית שנתית (%)"
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
                    value={row.targetAmount}
                    onChange={(e) => onChange('targetAmount', e.target.value)}
                    placeholder="יעד / מטרה (₪)"
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
                  />
                </div>
              </div>

              {/* Family member + Urgency (liabilities only) */}
              <div className="flex flex-wrap items-center gap-2">
                {familyMembers.length > 0 && (
                  <select
                    value={row.familyMemberId}
                    onChange={(e) => onChange('familyMemberId', e.target.value)}
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

                {isLiability && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 whitespace-nowrap">דחיפות:</span>
                    {URGENCY_OPTIONS.map(({ level, label, color: bg }) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => onChange('urgencyLevel', row.urgencyLevel === level ? null : level)}
                        title={label}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                          row.urgencyLevel === level ? 'border-slate-400 shadow-sm' : 'border-transparent opacity-40 hover:opacity-70'
                        } ${bg}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SectionProps {
  title: string;
  sectionRows: FillRow[];
  isLiability: boolean;
  familyMembers: FamilyMember[];
  updateRow: (id: string, field: keyof FillRow, val: unknown) => void;
  toggleExpand: (id: string) => void;
  toggleRemind: (id: string) => void;
}

function Section({ title, sectionRows, isLiability, familyMembers, updateRow, toggleExpand, toggleRemind }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold uppercase tracking-wide ${isLiability ? 'text-red-400' : 'text-green-500'}`}>
          {title}
        </span>
        <div className={`flex-1 h-px ${isLiability ? 'bg-red-100' : 'bg-green-100'}`} />
      </div>
      <div className="space-y-1.5">
        {sectionRows.map((row) => (
          <SuggestionRow
            key={row.suggestion.id}
            row={row}
            isLiability={isLiability}
            familyMembers={familyMembers}
            onChange={(f, v) => updateRow(row.suggestion.id, f, v)}
            onToggleExpand={() => toggleExpand(row.suggestion.id)}
            onToggleRemind={() => toggleRemind(row.suggestion.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AssetLiabilityQuickFillModal({
  isOpen,
  householdId,
  familyMembers,
  onClose,
  onSaved,
  onReminderChange,
}: AssetLiabilityQuickFillModalProps) {
  const [rows, setRows] = useState<FillRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const suggestions = loadSuggestions(householdId);
      const reminderIds = loadReminderIds(householdId);
      setRows(suggestions.map((s) => initRow(s, reminderIds)));
      setError(null);
    }
  }, [isOpen, householdId]);

  const updateRow = useCallback((id: string, field: keyof FillRow, val: unknown) => {
    setRows((prev) => prev.map((r) => r.suggestion.id === id ? { ...r, [field]: val } : r));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => r.suggestion.id === id ? { ...r, expanded: !r.expanded } : r));
  }, []);

  const toggleRemind = useCallback((id: string) => {
    setRows((prev) => {
      const next = prev.map((r) => r.suggestion.id === id ? { ...r, reminded: !r.reminded } : r);
      const reminderIds = next.filter((r) => r.reminded).map((r) => r.suggestion.id);
      saveReminderIds(householdId, reminderIds);
      onReminderChange?.();
      return next;
    });
  }, [householdId, onReminderChange]);

  const assetRows = rows.filter((r) => r.suggestion.side === AssetSide.ASSET);
  const liabilityRows = rows.filter((r) => r.suggestion.side === AssetSide.LIABILITY);

  const filledRows = rows.filter((r) => r.value.trim() && Number(r.value) > 0);

  const handleSave = async () => {
    if (filledRows.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const created: AssetLiabilityItem[] = [];
      for (const row of filledRows) {
        const item = await createAssetLiabilityItem({
          householdId,
          name: row.name,
          side: row.suggestion.side,
          category: row.category,
          value: row.value,
          currency: row.currency,
          interestRate: row.interestRate || null,
          targetAmount: row.targetAmount || null,
          familyMemberId: row.familyMemberId || null,
          urgencyLevel: row.urgencyLevel,
        });
        created.push(item);
      }
      onSaved(created);
      onClose();
    } catch {
      setError('שמירת הפריטים נכשלה. נסו שוב');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl my-6"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                  <ListPlus size={18} strokeWidth={ICON_STROKE} className="text-accent" />
                </div>
                <div>
                  <h2 className="heading-3">מילוי מהיר</h2>
                  <p className="text-xs text-slate-400 mt-0.5">לחצו על שורה להרחבה ומילוי פרטים מלאים</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/assets-liabilities/suggestions"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs hover:border-accent hover:text-accent transition-all duration-200"
                >
                  <ExternalLink size={13} strokeWidth={ICON_STROKE} />
                  נהל הצעות
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="סגור"
                  className="w-9 h-9 rounded-xl text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
                >
                  <X size={18} strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[62vh] overflow-y-auto space-y-6">
              <Section
                title="נכסים"
                sectionRows={assetRows}
                isLiability={false}
                familyMembers={familyMembers}
                updateRow={updateRow}
                toggleExpand={toggleExpand}
                toggleRemind={toggleRemind}
              />
              <Section
                title="התחייבויות"
                sectionRows={liabilityRows}
                isLiability={true}
                familyMembers={familyMembers}
                updateRow={updateRow}
                toggleExpand={toggleExpand}
                toggleRemind={toggleRemind}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {filledRows.length > 0 && (
                  <span className="text-xs text-slate-500">{filledRows.length} פריטים מוכנים להוספה</span>
                )}
                {error && <span className="text-xs text-red-500">{error}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:border-slate-300 transition-all"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={filledRows.length === 0 || isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={15} className="animate-spin" strokeWidth={ICON_STROKE} />
                  ) : (
                    <ListPlus size={15} strokeWidth={ICON_STROKE} />
                  )}
                  הוסף{filledRows.length > 0 ? ` (${filledRows.length})` : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
