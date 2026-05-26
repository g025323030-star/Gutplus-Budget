import { motion } from 'framer-motion';
import { FolderTree } from 'lucide-react';
import type { Category } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

interface ExpenseCategorySidebarProps {
  mainCategories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export default function ExpenseCategorySidebar({
  mainCategories,
  selectedCategoryId,
  onSelect,
}: ExpenseCategorySidebarProps) {
  return (
    <aside
      aria-label="קטגוריות ראשיות"
      className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <FolderTree
          className="text-accent"
          size={20}
          strokeWidth={ICON_STROKE}
        />
        <h2 className="heading-3">קטגוריות</h2>
      </div>

      <ul className="flex flex-col gap-1">
        <li>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`w-full text-right px-3 py-2 rounded-xl body-text-sm transition-colors duration-200 ${
              selectedCategoryId === null
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-primary hover:bg-slate-50'
            }`}
          >
            כל הקטגוריות
          </button>
        </li>
        {mainCategories.map((cat) => {
          const isActive = cat.id === selectedCategoryId;
          return (
            <li key={cat.id}>
              <motion.button
                type="button"
                onClick={() => onSelect(cat.id)}
                whileTap={{ scale: 0.98 }}
                aria-current={isActive ? 'true' : undefined}
                className={`w-full text-right px-3 py-2 rounded-xl body-text-sm transition-colors duration-200 ${
                  isActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-primary hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
