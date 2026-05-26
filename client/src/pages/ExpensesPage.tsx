import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { CategoryType } from '@gutplus/shared';
import type { Category, TransactionListItem } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getTransactions } from '../services/transactions.service';
import { getCategories } from '../services/categories.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import ExpenseCategorySidebar from '../components/expenses/ExpenseCategorySidebar';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseInputArea from '../components/expenses/ExpenseInputArea';

const PAGE_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

const padTwo = (n: number): string => String(n).padStart(2, '0');

const defaultDateFor = (year: number, month: number): string => {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() + 1 === month) {
    return `${year}-${padTwo(month)}-${padTwo(today.getDate())}`;
  }
  return `${year}-${padTwo(month)}-01`;
};

export default function ExpensesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const {
    householdId,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories],
  );

  const mainExpenseCategories = useMemo(
    () => expenseCategories.filter((c) => c.parentCategoryId === null),
    [expenseCategories],
  );

  const selectedCategory = useMemo(
    () =>
      selectedCategoryId
        ? expenseCategories.find((c) => c.id === selectedCategoryId) ?? null
        : null,
    [expenseCategories, selectedCategoryId],
  );

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tx, cats] = await Promise.all([
          getTransactions(selectedMonth, selectedYear),
          getCategories(),
        ]);
        if (cancelled) return;
        setTransactions(tx);
        setCategories(cats);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading expenses:', err);
        setError('שגיאה בטעינת ההוצאות. נסה לרענן את הדף.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear, householdId, reloadKey]);

  const handleModeChange = useCallback((next: PeriodMode) => {
    // Expense page is monthly-only in the new UX; ignore yearly.
    if (next !== 'monthly') return;
  }, []);

  const handleMonthChange = useCallback((next: number) => {
    setSelectedMonth(next);
  }, []);

  const handleYearChange = useCallback((next: number) => {
    setSelectedYear(next);
  }, []);

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const expenseItems = useMemo(() => {
    const categoryById = new Map<string, Category>();
    categories.forEach((c) => categoryById.set(c.id, c));
    return transactions.filter((item) => {
      if (!item.categoryId) return false;
      const cat = categoryById.get(item.categoryId);
      if (!cat) return false;
      return cat.type === CategoryType.EXPENSE;
    });
  }, [transactions, categories]);

  if (userLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-slate-100 animate-pulse rounded-2xl h-16" />
        <div className="bg-slate-100 animate-pulse rounded-2xl h-64" />
      </div>
    );
  }

  if (userError || !householdId) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-surface rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-3">
          <AlertCircle
            className="text-red-500"
            size={22}
            strokeWidth={ICON_STROKE}
          />
          <p className="body-text text-red-500">
            {userError ?? 'לא נמצא משק בית עבור המשתמש'}
          </p>
        </div>
      </div>
    );
  }

  const defaultRowDate = defaultDateFor(selectedYear, selectedMonth);

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-6"
    >
      <motion.header
        variants={ITEM_VARIANTS}
        className="flex items-center gap-3"
      >
        <TrendingDown
          className="text-accent"
          size={28}
          strokeWidth={ICON_STROKE}
        />
        <div>
          <h1 className="heading-2">הוצאות</h1>
          <p className="body-text-sm text-slate-500 leading-relaxed">
            בחר קטגוריה ראשית כדי להוסיף הוצאות. הרשימה המלאה לחודש הנבחר מוצגת
            מתחת.
          </p>
        </div>
      </motion.header>

      <motion.div variants={ITEM_VARIANTS}>
        <PeriodToggle
          mode={'monthly' as PeriodMode}
          onModeChange={handleModeChange}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />
      </motion.div>

      {error && (
        <motion.div
          variants={ITEM_VARIANTS}
          className="bg-surface rounded-2xl shadow-sm border border-red-100 p-4 flex items-center gap-3"
        >
          <AlertCircle
            className="text-red-500"
            size={20}
            strokeWidth={ICON_STROKE}
          />
          <p className="body-text text-red-500">{error}</p>
        </motion.div>
      )}

      <motion.div
        variants={ITEM_VARIANTS}
        className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6"
      >
        <ExpenseCategorySidebar
          mainCategories={mainExpenseCategories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleSelectCategory}
        />

        <div className="space-y-6">
          <ExpenseInputArea
            selectedCategory={selectedCategory}
            householdId={householdId}
            defaultDate={defaultRowDate}
            onSaved={handleSaved}
          />

          <ExpenseList
            items={expenseItems}
            categories={categories}
            isLoading={isLoading}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
