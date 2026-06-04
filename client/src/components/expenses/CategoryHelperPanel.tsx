import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Sparkles } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import { getCategoryVisual } from '../../data/category-visuals.constants';

interface CategoryHelperPanelProps {
  mainCategories: Category[];
  allCategories: Category[];
  focusedRowId: string | null;
  focusedRowDescription: string;
  focusedRowIndex: number | null;
  onPickSubcategory: (categoryId: string) => void;
  isFirstUse?: boolean;
  // onFillCategoryTemplates?: (mainId: string) => void;
  selectedMainId: string | null;
  onSelectedMainIdChange: (id: string | null) => void;
}

export default function CategoryHelperPanel({
  mainCategories,
  allCategories,
  focusedRowId,
  focusedRowDescription,
  focusedRowIndex,
  onPickSubcategory,
  isFirstUse = false,
  // onFillCategoryTemplates,
  selectedMainId,
  onSelectedMainIdChange,
}: CategoryHelperPanelProps) {

  const subcategories = useMemo(() => {
    if (!selectedMainId) return [];
    return allCategories.filter((c) => c.parentCategoryId === selectedMainId);
  }, [allCategories, selectedMainId]);

  const disabled = focusedRowId === null;
  
const handleCategoryClick = (catId: string) => {
  onSelectedMainIdChange(catId);
};

  return (
    <aside
      aria-label="עוזר קטגוריות"
      className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col"
    >
      <div className="mb-4">
        <h3 className="heading-3 flex items-center gap-2">
          <Sparkles
            className="text-accent"
            size={18}
            strokeWidth={ICON_STROKE}
          />
          עוזר קטגוריות מהיר
        </h3>
        <p className="body-text-sm text-slate-400 mt-1">
          {isFirstUse
            ? 'לחצו על קטגוריה כדי למלא שורות פתיחה לרישום מהיר'
            : 'בחר שורה מהטבלה, ולחץ על קטגוריה ותת-קטגוריה כדי להזין במהירות.'}
        </p>
      </div>

      {isFirstUse ? null : focusedRowId !== null ? (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
            <span className="body-text-sm font-bold text-accent">
              מזין כעת לשורה{focusedRowIndex !== null ? ` #${focusedRowIndex + 1}` : ''}
            </span>
          </div>
          <span className="body-text-sm font-semibold text-slate-400 truncate">
            {focusedRowDescription || 'ללא תיאור'}
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center body-text-sm text-amber-600 font-medium">
          בחר שורה בטבלה כדי להתחיל להזין קטגוריות
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {mainCategories.map((cat) => {
          const visual = getCategoryVisual(cat.name);
          const Icon = visual.icon;
          const isSelected = selectedMainId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.id)}
              aria-pressed={isSelected}
              aria-label={
                isFirstUse
                  ? `מלא שורות פתיחה עבור ${cat.name}`
                  : undefined
              }
              className={`p-3 rounded-xl border text-right flex flex-col justify-between h-20 transition-all duration-200 ${
                isSelected
                  ? 'bg-primary border-transparent text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/60 text-primary'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-white/10' : 'bg-white shadow-sm'
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={ICON_STROKE}
                  style={{ color: isSelected ? '#ffffff' : visual.color }}
                />
              </div>
              <span className="body-text-sm font-bold mt-2">{cat.name}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="label-text text-slate-400 mb-3 uppercase tracking-wider">
          תתי קטגוריות זמינות:
        </h4>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          <AnimatePresence mode="wait">
            {subcategories.length === 0 ? (
              <motion.p
                key={`empty-${selectedMainId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="body-text-sm text-slate-400"
              >
                אין תתי קטגוריות זמינות
              </motion.p>
            ) : (
              /* התיקון: איחוד מערך הכפתורים תחת אלמנט אב יחיד עבור AnimatePresence */
              <motion.div
                key={`list-${selectedMainId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2 w-full"
              >
                {subcategories.map((sub, idx) => (
                  <motion.button
                    key={`${selectedMainId}-${sub.id}`}
                    type="button"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    onClick={() => onPickSubcategory(sub.id)}
                    disabled={disabled}
                    aria-label={`בחר תת-קטגוריה ${sub.name}`}
                    className={`px-3 py-2 rounded-xl body-text-sm font-semibold border transition-all duration-200 ${
                      disabled
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-surface hover:bg-accent hover:text-white border-slate-200 text-slate-600 hover:border-transparent active:scale-95 shadow-sm'
                    }`}
                  >
                    {sub.name}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 bg-background/60 p-3 rounded-xl flex items-start gap-2 border border-slate-200/40">
        <Info
          size={14}
          strokeWidth={ICON_STROKE}
          className="text-accent shrink-0 mt-0.5"
        />
        <p className="text-[11px] text-slate-500 leading-normal">
          לחיצה על תת-קטגוריה מזינה אותה לשורה הנבחרת ועוברת אוטומטית לשורה הבאה להזנה מהירה.
        </p>
      </div>
    </aside>
  );
}