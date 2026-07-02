import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Plus, Trash2, X, Check } from 'lucide-react';
import { AssetLiabilityCategory, AssetSide, CurrencyCode } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  DEFAULT_SUGGESTIONS,
  loadCustomSuggestions,
  saveCustomSuggestions,
} from '../data/asset-liability-default-suggestions';
import type { AssetLiabilitySuggestion } from '../data/asset-liability-default-suggestions';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../components/assets/category-visuals';

const SIDE_LABELS: Record<AssetSide, string> = {
  [AssetSide.ASSET]: 'נכס',
  [AssetSide.LIABILITY]: 'התחייבות',
};

function SuggestionRow({
  suggestion,
  onRemove,
  canRemove,
}: {
  suggestion: AssetLiabilitySuggestion;
  onRemove?: () => void;
  canRemove: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const color = CATEGORY_COLORS[suggestion.category];

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:bg-slate-50/70 hover:border-slate-100 transition-all duration-200">
      <span
        style={{ color, backgroundColor: `${color}1A`, borderColor: `${color}40` }}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border leading-tight shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {CATEGORY_LABELS[suggestion.category]}
      </span>

      <span className="flex-1 text-sm font-medium text-primary">{suggestion.name}</span>

      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
        suggestion.side === AssetSide.ASSET
          ? 'bg-green-50 text-green-600 border border-green-100'
          : 'bg-red-50 text-red-500 border border-red-100'
      }`}>
        {SIDE_LABELS[suggestion.side]}
      </span>

      {canRemove && (
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => { onRemove?.(); setConfirming(false); }}
                className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
              >
                מחק
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
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
              onClick={() => setConfirming(true)}
              className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={15} strokeWidth={ICON_STROKE} />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {!canRemove && (
        <span className="text-[10px] text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          ברירת מחדל
        </span>
      )}
    </div>
  );
}

const CATEGORY_OPTIONS = Object.values(AssetLiabilityCategory);
const SIDE_OPTIONS = [AssetSide.ASSET, AssetSide.LIABILITY];

export default function AssetLiabilitySuggestionsPage() {
  const { householdId } = useCurrentUser();

  const [customSuggestions, setCustomSuggestions] = useState<AssetLiabilitySuggestion[]>(() =>
    householdId ? loadCustomSuggestions(householdId) : [],
  );

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AssetLiabilityCategory>(AssetLiabilityCategory.REAL_ESTATE);
  const [newSide, setNewSide] = useState<AssetSide>(AssetSide.ASSET);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddCustom = () => {
    if (!newName.trim()) {
      setFormError('נא להזין שם');
      return;
    }
    if (!householdId) return;

    const newSuggestion: AssetLiabilitySuggestion = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      side: newSide,
      currency: CurrencyCode.ILS,
      isCustom: true,
    };

    const updated = [...customSuggestions, newSuggestion];
    setCustomSuggestions(updated);
    saveCustomSuggestions(householdId, updated);
    setNewName('');
    setNewCategory(AssetLiabilityCategory.REAL_ESTATE);
    setNewSide(AssetSide.ASSET);
    setFormError(null);
    setAddingNew(false);
  };

  const handleRemoveCustom = (id: string) => {
    if (!householdId) return;
    const updated = customSuggestions.filter((s) => s.id !== id);
    setCustomSuggestions(updated);
    saveCustomSuggestions(householdId, updated);
  };

  const allSuggestions = [...DEFAULT_SUGGESTIONS, ...customSuggestions];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/assets-liabilities"
          className="p-2 rounded-xl text-slate-400 hover:text-accent hover:bg-accent/10 transition-all duration-200"
          aria-label="חזור לנכסים מול התחייבויות"
        >
          <ArrowRight size={20} strokeWidth={ICON_STROKE} />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Sparkles size={22} strokeWidth={ICON_STROKE} className="text-accent" />
        </div>
        <div>
          <h1 className="heading-2">הצעות מילוי מהיר</h1>
          <p className="body-text-sm text-slate-400 mt-0.5">
            ניהול רשימת ההצעות שמוצגות בלחיצה על ״מילוי מהיר״
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="heading-3">כל ההצעות</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {DEFAULT_SUGGESTIONS.length} ברירת מחדל · {customSuggestions.length} מותאמות אישית
            </p>
          </div>
          {!addingNew && (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl label-text shadow-sm shadow-accent/10 hover:shadow-md hover:shadow-accent/20 transition-all duration-300"
            >
              <Plus size={16} strokeWidth={ICON_STROKE} />
              הוסף הצעה
            </button>
          )}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {addingNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 rounded-2xl border-2 border-accent/30 bg-slate-50/80 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="שם ההצעה (למשל: קרן פנסיה נוספת)"
                    autoFocus
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all text-right"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AssetLiabilityCategory)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                  <select
                    value={newSide}
                    onChange={(e) => setNewSide(e.target.value as AssetSide)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:border-accent transition-all"
                  >
                    {SIDE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{SIDE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                {formError && <p className="text-red-500 text-xs">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setAddingNew(false); setFormError(null); setNewName(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:border-slate-300 transition-all"
                  >
                    <X size={14} strokeWidth={ICON_STROKE} />
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                  >
                    <Check size={14} strokeWidth={ICON_STROKE} />
                    הוסף
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {allSuggestions.map((s) => (
            <SuggestionRow
              key={s.id}
              suggestion={s}
              canRemove={!!s.isCustom}
              onRemove={s.isCustom ? () => handleRemoveCustom(s.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="flex justify-center">
        <Link
          to="/assets-liabilities"
          className="flex items-center gap-2 text-accent hover:underline label-text"
        >
          <ArrowRight size={16} strokeWidth={ICON_STROKE} />
          חזרה לנכסים מול התחייבויות
        </Link>
      </div>
    </div>
  );
}
