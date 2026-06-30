import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info, Sparkles } from 'lucide-react';
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
  selectedMainId: string | null;
  onSelectedMainIdChange: (id: string | null) => void;
  needsReviewCounts?: Record<string, number>;
  selectedSubcategoryId: string | null;
}

export default function CategoryHelperPanel({
  mainCategories,
  allCategories,
  focusedRowId: _focusedRowId,
  focusedRowDescription: _focusedRowDescription,
  focusedRowIndex: _focusedRowIndex,
  onPickSubcategory,
  isFirstUse = false,
  selectedMainId,
  onSelectedMainIdChange,
  needsReviewCounts = {},
  selectedSubcategoryId,
}: CategoryHelperPanelProps) {

  const mainCategoryReviewCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const main of mainCategories) {
      let count = needsReviewCounts[main.id] ?? 0;
      for (const sub of allCategories) {
        if (sub.parentCategoryId === main.id) {
          count += needsReviewCounts[sub.id] ?? 0;
        }
      }
      result[main.id] = count;
    }
    return result;
  }, [mainCategories, allCategories, needsReviewCounts]);

  const handleAccordionToggle = (catId: string) => {
    onSelectedMainIdChange(selectedMainId === catId ? null : catId);
  };

  return (
    <aside
      aria-label="עוזר קטגוריות"
      className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4"
    >
      <div>
        <h3 className="heading-3 flex items-center gap-2">
          <Sparkles className="text-accent" size={18} strokeWidth={ICON_STROKE} />
          עוזר קטגוריות מהיר
        </h3>
        <p className="body-text-sm text-slate-400 mt-1">
          {isFirstUse
            ? 'בחרו קטגוריה ותת-קטגוריה להוספה מהירה'
            : 'לחצו על תת-קטגוריה להוספה מיידית לראש הטבלה'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {mainCategories.map((cat) => {
          const visual = getCategoryVisual(cat.name);
          const Icon = visual.icon;
          const isOpen = selectedMainId === cat.id;
          const reviewCount = mainCategoryReviewCounts[cat.id] ?? 0;
          const catSubs = allCategories.filter((c) => c.parentCategoryId === cat.id);

          return (
            <div
              key={cat.id}
              className={`rounded-xl overflow-hidden border transition-colors duration-200 ${
                isOpen ? visual.borderClass : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => handleAccordionToggle(cat.id)}
                aria-expanded={isOpen}
                className={`w-full h-14 px-4 flex items-center gap-3 transition-colors duration-200 ${
                  isOpen ? visual.bgClass : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${visual.iconBgClass}`}
                >
                  <Icon
                    size={16}
                    strokeWidth={ICON_STROKE}
                    className={visual.textClass}
                  />
                </div>

                <span
                  className={`body-text-sm font-semibold flex-1 text-right transition-colors duration-200 ${
                    isOpen ? visual.textClass : 'text-primary'
                  }`}
                >
                  {cat.name}
                </span>

                {reviewCount > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                    aria-label={`${reviewCount} שורות לבדיקה`}
                  >
                    {reviewCount}
                  </span>
                )}

                <ChevronDown
                  size={16}
                  strokeWidth={ICON_STROKE}
                  className={`shrink-0 transition-all duration-200 ${
                    isOpen ? `rotate-180 ${visual.textClass}` : 'text-slate-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`p-3 flex flex-wrap gap-2 border-t ${visual.borderClass}`}
                    >
                      {catSubs.length === 0 ? (
                        <p className="body-text-sm text-slate-400 py-1">
                          אין תתי קטגוריות זמינות
                        </p>
                      ) : (
                        catSubs.map((sub, idx) => {
                          const isSelected = sub.id === selectedSubcategoryId;
                          return (
                            <motion.button
                              key={sub.id}
                              type="button"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.14, delay: idx * 0.025 }}
                              onClick={() => onPickSubcategory(sub.id)}
                              aria-pressed={isSelected}
                              aria-label={`הוסף שורה עם תת-קטגוריה ${sub.name}`}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border body-text-sm font-medium transition-all duration-200 active:scale-95 ${
                                isSelected
                                  ? `${visual.pillSelectedBgClass} ${visual.pillSelectedBorderClass} ${visual.textClass}`
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${visual.dotClass} ${
                                  isSelected ? 'opacity-100' : 'opacity-50'
                                }`}
                              />
                              {sub.name}
                            </motion.button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-auto bg-background/60 p-3 rounded-xl flex items-start gap-2 border border-slate-200/40">
        <Info size={14} strokeWidth={ICON_STROKE} className="text-accent shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-normal">
          לחיצה על תת-קטגוריה מוסיפה שורה חדשה בטבלה עם הקטגוריה מוזנת מראש
        </p>
      </div>
    </aside>
  );
}
