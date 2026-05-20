import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { CategoryType } from '@gutplus/shared';
import type { Category, Transaction } from '@gutplus/shared';
import { ICON_STROKE } from '../constants/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getTransactions } from '../services/transactions.service';
import { getCategories } from '../services/categories.service';
import PeriodToggle from '../components/snapshot/PeriodToggle';
import type { PeriodMode } from '../components/snapshot/PeriodToggle';
import TransactionTable from '../components/transactions/TransactionTable';
import type { DraftRow } from '../components/transactions/types';
import HolidayExpensesSection from '../components/expenses/HolidayExpensesSection';

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

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toIsoDate = (raw: string): string => {
  if (!raw) return '';
  if (raw.length >= 10 && raw[4] === '-' && raw[7] === '-') {
    return raw.slice(0, 10);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const txToDraftRow = (tx: Transaction): DraftRow => {
  const description = tx.description ?? '';
  const categoryId = tx.categoryId ?? null;
  const amount = tx.amount ?? '';
  const date = toIsoDate(tx.date);
  const snapshot = { description, categoryId, amount, date };
  return {
    localId: newLocalId(),
    serverId: tx.id,
    description,
    categoryId,
    amount,
    date,
    status: 'idle',
    errorMessage: null,
    lastSavedSnapshot: snapshot,
  };
};

const filterToExpenses = (
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  householdId: string,
  yearConstraint: number,
  monthConstraint?: number,
): Transaction[] =>
  transactions.filter((tx) => {
    if (tx.householdId !== householdId) return false;
    const category = tx.categoryId ? categoryById.get(tx.categoryId) : null;
    if (!category || category.type !== CategoryType.EXPENSE) return false;
    const d = new Date(tx.date);
    if (Number.isNaN(d.getTime())) return false;
    if (d.getFullYear() !== yearConstraint) return false;
    if (monthConstraint && d.getMonth() + 1 !== monthConstraint) return false;
    return true;
  });

export default function ExpensesPage() {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [rows, setRows] = useState<DraftRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    householdId,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === CategoryType.EXPENSE),
    [categories],
  );

  const hasUnsaved = useMemo(
    () => rows.some((r) => r.status === 'dirty' || r.status === 'error'),
    [rows],
  );

  useEffect(() => {
    if (!householdId) return;

    let cancelled = false;
    const monthConstraint = mode === 'monthly' ? selectedMonth : undefined;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [tx, cats] = await Promise.all([
          getTransactions(monthConstraint, selectedYear),
          getCategories(),
        ]);
        if (cancelled) return;

        const localCategoryById = new Map<string, Category>();
        cats.forEach((c) => localCategoryById.set(c.id, c));

        const filtered = filterToExpenses(
          tx,
          localCategoryById,
          householdId,
          selectedYear,
          monthConstraint,
        );

        setCategories(cats);
        setRows(filtered.map(txToDraftRow));
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
  }, [mode, selectedMonth, selectedYear, householdId]);

  const confirmDiscardUnsaved = useCallback((): boolean => {
    if (!hasUnsaved) return true;
    return window.confirm('יש שינויים שלא נשמרו בטבלה. לעבור בכל זאת?');
  }, [hasUnsaved]);

  const handleModeChange = useCallback(
    (next: PeriodMode) => {
      if (!confirmDiscardUnsaved()) return;
      setMode(next);
    },
    [confirmDiscardUnsaved],
  );

  const handleMonthChange = useCallback(
    (next: number) => {
      if (!confirmDiscardUnsaved()) return;
      setSelectedMonth(next);
    },
    [confirmDiscardUnsaved],
  );

  const handleYearChange = useCallback(
    (next: number) => {
      if (!confirmDiscardUnsaved()) return;
      setSelectedYear(next);
    },
    [confirmDiscardUnsaved],
  );

  const handleHolidayTransactionsCreated = useCallback(
    (transactions: Transaction[]) => {
      if (!householdId) return;
      const monthConstraint = mode === 'monthly' ? selectedMonth : undefined;
      const newRows = transactions
        .filter((tx) => {
          const d = new Date(tx.date);
          if (Number.isNaN(d.getTime())) return false;
          if (d.getFullYear() !== selectedYear) return false;
          if (monthConstraint && d.getMonth() + 1 !== monthConstraint)
            return false;
          return tx.householdId === householdId;
        })
        .map(txToDraftRow);

      if (newRows.length > 0) {
        setRows((prev) => [...prev, ...newRows]);
      }
    },
    [householdId, mode, selectedMonth, selectedYear],
  );

  const monthConstraint = mode === 'monthly' ? selectedMonth : undefined;

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
            הזן הוצאות חודשיות ושנתיות. בתצוגה השנתית ניתן גם להוסיף הוצאות לפי
            חגים.
          </p>
        </div>
      </motion.header>

      <motion.div variants={ITEM_VARIANTS}>
        <PeriodToggle
          mode={mode}
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

      <motion.div variants={ITEM_VARIANTS}>
        <TransactionTable
          rows={rows}
          categories={expenseCategories}
          householdId={householdId}
          monthConstraint={monthConstraint}
          yearConstraint={selectedYear}
          onChange={setRows}
          isLoading={isLoading}
        />
      </motion.div>

      {mode === 'yearly' && (
        <motion.div variants={ITEM_VARIANTS}>
          <HolidayExpensesSection
            year={selectedYear}
            categories={expenseCategories}
            householdId={householdId}
            onTransactionsCreated={handleHolidayTransactionsCreated}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
