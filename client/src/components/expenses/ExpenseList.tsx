import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import type { Category, TransactionListItem } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';

interface ExpenseListProps {
  items: TransactionListItem[];
  categories: Category[];
  isLoading?: boolean;
}

interface GroupedItems {
  mainCategoryId: string | null;
  mainCategoryName: string;
  items: TransactionListItem[];
}

const UNCATEGORIZED_LABEL = 'ללא קטגוריה ראשית';

const formatAmount = (raw: string | number): string => {
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (!Number.isFinite(n)) return String(raw);
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

const isProjectionItem = (
  item: TransactionListItem,
): item is Extract<TransactionListItem, { isProjection: true }> =>
  (item as { isProjection?: boolean }).isProjection === true;

const itemKey = (item: TransactionListItem): string => {
  if (isProjectionItem(item)) {
    return `proj-${item.recurringTransactionId}-${item.date}`;
  }
  return `tx-${item.id}`;
};

export default function ExpenseList({
  items,
  categories,
  isLoading = false,
}: ExpenseListProps) {
  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const resolveMainCategory = (categoryId: string | null): Category | null => {
    if (!categoryId) return null;
    const cat = categoryById.get(categoryId);
    if (!cat) return null;
    if (cat.parentCategoryId === null) return cat;
    const parent = categoryById.get(cat.parentCategoryId);
    return parent ?? cat;
  };

  const groups: GroupedItems[] = useMemo(() => {
    const buckets = new Map<string, GroupedItems>();
    items.forEach((item) => {
      const main = resolveMainCategory(item.categoryId);
      const key = main?.id ?? '__none__';
      if (!buckets.has(key)) {
        buckets.set(key, {
          mainCategoryId: main?.id ?? null,
          mainCategoryName: main?.name ?? UNCATEGORIZED_LABEL,
          items: [],
        });
      }
      buckets.get(key)!.items.push(item);
    });
    return Array.from(buckets.values()).sort((a, b) =>
      a.mainCategoryName.localeCompare(b.mainCategoryName, 'he'),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, categoryById]);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-slate-100 animate-pulse rounded-xl h-12"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
        <Receipt
          className="text-accent"
          size={20}
          strokeWidth={ICON_STROKE}
        />
        <h2 className="heading-3">ההוצאות שלך</h2>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="body-text text-slate-500">
            אין הוצאות לחודש הנבחר.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {groups.map((group) => (
            <section key={group.mainCategoryId ?? '__none__'} className="px-6 py-4">
              <header className="mb-3">
                <h3 className="label-text text-slate-500 uppercase tracking-wide">
                  {group.mainCategoryName}
                </h3>
              </header>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const projection = isProjectionItem(item);
                  return (
                    <motion.li
                      key={itemKey(item)}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1fr_1fr] items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50/60 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="body-text text-primary truncate">
                          {item.description}
                        </span>
                        {projection && (
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
                            צפוי
                          </span>
                        )}
                      </div>
                      <span className="body-text-sm text-slate-500 text-end">
                        {formatDate(item.date)}
                      </span>
                      <span className="body-text text-primary font-semibold text-end">
                        {formatAmount(item.amount)}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
