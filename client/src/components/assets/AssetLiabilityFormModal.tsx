import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { AssetLiabilityCategory, AssetSide, CurrencyCode, FamilyMemberRole } from '@gutplus/shared';
import type { AssetLiabilityItem, FamilyMember } from '@gutplus/shared';
import {
  createAssetLiabilityItem,
  updateAssetLiabilityItem,
} from '../../services/asset-liability-items.service';
import type { AssetLiabilitySide } from './AssetLiabilityToggle';
import { CATEGORY_LABELS } from './category-visuals';
export { CATEGORY_LABELS } from './category-visuals';

const FAMILY_MEMBER_ROLE_LABELS: Record<FamilyMemberRole, string> = {
  [FamilyMemberRole.Parent]: 'הורה',
  [FamilyMemberRole.Child]: 'ילד/ה',
};

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  [CurrencyCode.ILS]: '₪ שקל (ILS)',
  [CurrencyCode.USD]: '$ דולר (USD)',
  [CurrencyCode.EUR]: '€ אירו (EUR)',
  [CurrencyCode.GBP]: '£ פאונד (GBP)',
};

const URGENCY_OPTIONS = [
  { level: 1, label: 'נמוכה', color: 'bg-green-500' },
  { level: 2, label: 'בינונית', color: 'bg-yellow-400' },
  { level: 3, label: 'גבוהה', color: 'bg-red-500' },
];

interface AssetLiabilityFormModalProps {
  isOpen: boolean;
  householdId: string;
  side: AssetLiabilitySide;
  item?: AssetLiabilityItem | null;
  familyMembers: FamilyMember[];
  onClose: () => void;
  onSaved: (item: AssetLiabilityItem) => void;
}

export default function AssetLiabilityFormModal({
  isOpen,
  householdId,
  side,
  item,
  familyMembers,
  onClose,
  onSaved,
}: AssetLiabilityFormModalProps) {
  const isEditing = item != null;

  const [category, setCategory] = useState<AssetLiabilityCategory>(AssetLiabilityCategory.REAL_ESTATE);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(CurrencyCode.ILS);
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setCategory(item.category);
        setName(item.name);
        setValue(item.value);
        setCurrency(item.currency);
        setFamilyMemberId(item.familyMemberId ?? '');
        setUrgencyLevel(item.urgencyLevel);
      } else {
        setCategory(AssetLiabilityCategory.REAL_ESTATE);
        setName('');
        setValue('');
        setCurrency(CurrencyCode.ILS);
        setFamilyMemberId('');
        setUrgencyLevel(null);
      }
      setError(null);
    }
  }, [isOpen, item]);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('נא להזין שם / תיאור לפריט');
      return;
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError('נא להזין שווי חיובי');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const sideEnum = side === 'assets' ? AssetSide.ASSET : AssetSide.LIABILITY;
      const payload = {
        name: name.trim(),
        side: sideEnum,
        category,
        value,
        currency,
        familyMemberId: familyMemberId || null,
        urgencyLevel: urgencyLevel,
      };

      let saved: AssetLiabilityItem;
      if (isEditing) {
        saved = await updateAssetLiabilityItem(item.id, payload);
      } else {
        saved = await createAssetLiabilityItem({ ...payload, householdId });
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      console.error(err);
      setError('שמירת הפריט נכשלה. נסו שוב');
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
          className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="heading-2">{isEditing ? 'עריכת פריט' : 'פריט חדש'}</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="סגור"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <p className="body-text-sm text-slate-400 mb-5">
              מוסיף לרשימת{' '}
              <span className={`font-bold ${side === 'assets' ? 'text-green-600' : 'text-red-500'}`}>
                {side === 'assets' ? 'נכסים' : 'התחייבויות'}
              </span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category picker */}
              <div>
                <label className="text-sm font-bold text-primary block mb-2">קטגוריה</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(AssetLiabilityCategory).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        category === cat
                          ? 'bg-accent text-white shadow-sm'
                          : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-bold text-primary block mb-2">שם / תיאור</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: דירה ראשונה, חסכון ליעל, משכנתא בנק הפועלים"
                  autoFocus
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                />
              </div>

              {/* Value + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-bold text-primary block mb-2">שווי / יתרה</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-primary block mb-2">מטבע</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    disabled={isSaving}
                    className="px-3 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all"
                  >
                    {Object.values(CurrencyCode).map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Family member */}
              <div>
                <label className="text-sm font-bold text-primary block mb-2">
                  שיוך לבן משפחה (אופציונלי)
                </label>
                <select
                  value={familyMemberId}
                  onChange={(e) => setFamilyMemberId(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                >
                  <option value="">ללא שיוך לבן משפחה</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({FAMILY_MEMBER_ROLE_LABELS[m.role]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency — liabilities only */}
              {side === 'liabilities' && (
                <div>
                  <label className="text-sm font-bold text-primary block mb-2">
                    רמת דחיפות להחזר
                  </label>
                  <div className="flex gap-2">
                    {URGENCY_OPTIONS.map(({ level, label, color }) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setUrgencyLevel(urgencyLevel === level ? null : level)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          urgencyLevel === level
                            ? 'border-slate-300 bg-slate-100 shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 transition-all"
                >
                  ביטול
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  disabled={isSaving}
                  className="flex-1 bg-accent text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>שומר</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'עדכון פריט' : 'הוספת פריט'}</span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
