import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Category, CategoryType } from '@gutplus/shared';
import { createCategory } from '../../services/categories.service';

interface CategoryFormModalProps {
  isOpen: boolean;
  householdId: string;
  type: CategoryType;
  existingCategories: Category[];
  onClose: () => void;
  onCreated: (category: Category) => void;
}

export default function CategoryFormModal({
  isOpen,
  householdId,
  type,
  existingCategories,
  onClose,
  onCreated,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setParentCategoryId('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const parentOptions = useMemo(
    () =>
      existingCategories
        .filter((c) => c.type === type && c.parentCategoryId === null)
        .sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [existingCategories, type],
  );

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('נא להזין שם לקטגוריה');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const created = await createCategory({
        name: trimmed,
        type,
        householdId,
        parentCategoryId: parentCategoryId || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Create category failed:', err);
      setError('שמירת הקטגוריה נכשלה. נסה שוב');
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
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3">קטגוריה חדשה</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="סגור"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-primary hover:bg-background transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text block mb-2">שם הקטגוריה</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: חוגים לילדים"
                  autoFocus
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                />
              </div>

              <div>
                <label className="label-text block mb-2">
                  קטגוריית אב (אופציונלי)
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-background/50 text-primary focus:outline-none focus:border-accent focus:bg-white transition-all text-right"
                >
                  <option value="">— קטגוריית אב חדשה —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="body-text-sm text-slate-500 mt-1">
                  אם לא נבחר אב — הקטגוריה תהיה קטגוריית אב חדשה.
                </p>
              </div>

              {error && (
                <p className="body-text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-primary hover:bg-background transition-all label-text disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all label-text disabled:opacity-50"
                >
                  {isSaving ? 'שומר…' : 'שמירה'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
