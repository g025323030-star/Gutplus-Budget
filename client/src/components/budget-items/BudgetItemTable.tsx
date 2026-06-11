import { useCallback, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ListPlus, Plus } from 'lucide-react';
import type { Category, CategoryFrequency } from '@gutplus/shared';
import { CurrencyCode, TransactionFrequency } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import {
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from '../../services/budget-items.service';
import BudgetItemRow, { validateRow } from './BudgetItemRow';
import type { DraftRow } from './types';
import { snapshotOf, snapshotsEqual } from './types';

const padTwo = (n: number): string => String(n).padStart(2, '0');

const defaultDateFor = (year: number, month?: number): string => {
  if (month) return `${year}-${padTwo(month)}-01`;
  const today = new Date();
  if (today.getFullYear() === year) {
    return `${year}-${padTwo(today.getMonth() + 1)}-${padTwo(today.getDate())}`;
  }
  return `${year}-01-01`;
};

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      'שגיאת רשת. נסה שוב.'
    );
  }
  if (err instanceof Error) return err.message;
  return 'שגיאה בשמירה';
};

interface BudgetItemTableProps {
  rows: DraftRow[];
  categories: Category[];
  householdId: string;
  frequency: CategoryFrequency;
  monthConstraint?: number;
  yearConstraint: number;
  onChange: (rows: DraftRow[]) => void;
  isLoading?: boolean;
  focusedRowId?: string | null;
  onRowFocus?: (localId: string) => void;
  onAddCategoryRequest?: (localId: string) => void;
  onAdvancedModeRequest?: (localId: string) => void;
  onAfterAdvancedModeSave?: () => void;
  onFillTemplates?: () => void;
  showTemplatesButton?: boolean;
  title?: string;
  descriptionPlaceholder?: string;
}

export default function BudgetItemTable({
  rows,
  categories,
  householdId,
  frequency,
  monthConstraint,
  yearConstraint,
  onChange,
  isLoading = false,
  focusedRowId = null,
  onRowFocus,
  onAddCategoryRequest,
  onAdvancedModeRequest,
  onAfterAdvancedModeSave,
  onFillTemplates,
  showTemplatesButton = false,
  title = 'רשימת הוצאות',
  descriptionPlaceholder = 'לדוגמה: סופר',
}: BudgetItemTableProps) {
  const rowsRef = useRef<DraftRow[]>(rows);
  const pendingResave = useRef<Record<string, boolean>>({});
  const newRowFocus = useRef<string | null>(null);
  const fadeTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(
    () => () => {
      Object.values(fadeTimers.current).forEach((id) =>
        window.clearTimeout(id),
      );
    },
    [],
  );

  const patchRow = useCallback(
    (localId: string, patch: Partial<DraftRow>) => {
      const next = rowsRef.current.map((r) =>
        r.localId === localId ? { ...r, ...patch } : r,
      );
      rowsRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const removeRow = useCallback(
    (localId: string) => {
      const next = rowsRef.current.filter((r) => r.localId !== localId);
      rowsRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const scheduleSyncedFade = useCallback(
    (localId: string) => {
      if (fadeTimers.current[localId]) {
        window.clearTimeout(fadeTimers.current[localId]);
      }
      fadeTimers.current[localId] = window.setTimeout(() => {
        const target = rowsRef.current.find((r) => r.localId === localId);
        if (target && target.status === 'synced') {
          patchRow(localId, { status: 'idle' });
        }
        delete fadeTimers.current[localId];
      }, 1500);
    },
    [patchRow],
  );

  const persistRow = useCallback(
    async (localId: string): Promise<void> => {
      const current = rowsRef.current.find((r) => r.localId === localId);
      if (!current) return;

      if (current.status === 'saving') {
        pendingResave.current[localId] = true;
        return;
      }

      if (!validateRow(current, yearConstraint, monthConstraint)) {
        return;
      }

      const snapshot = snapshotOf(current);
      if (snapshotsEqual(current.lastSavedSnapshot, snapshot)) {
        return;
      }

      patchRow(localId, { status: 'saving', errorMessage: null });

      try {
        let savedId = current.serverId;
        // Installments and recurring are create-only and mutually exclusive
        // (enforced by createBudgetItemSchema on the server).
        const isUnsavedInstallments =
          !savedId &&
          current.mode === 'installments' &&
          current.installmentsTotal !== null &&
          current.installmentsTotal >= 2;
        const isUnsavedRecurring = !savedId && current.mode === 'recurring';

        const base = {
          amount: current.amount,
          date: current.date,
          description: current.description.trim(),
          frequency,
          householdId,
          categoryId: current.categoryId ?? undefined,
          needsReview: current.needsReview,
          targetAmount: current.targetAmount ?? undefined,
          currency: current.currency ?? CurrencyCode.ILS,
        };

        const payload = isUnsavedInstallments
          ? { ...base, installmentsTotal: current.installmentsTotal! }
          : isUnsavedRecurring
            ? {
                ...base,
                isRecurring: true as const,
                recurringFrequency: current.isBiMonthly
                  ? TransactionFrequency.BI_MONTHLY
                  : TransactionFrequency.MONTHLY,
                ...(current.endDate ? { endDate: current.endDate } : {}),
              }
            : base;

        if (savedId) {
          await updateBudgetItem(savedId, base);
        } else {
          const created = await createBudgetItem(payload);
          if (created.kind === 'budgetItems' && created.data.length > 0) {
            savedId = created.data[0].id;
          }
        }

        patchRow(localId, {
          status: 'synced',
          serverId: savedId,
          lastSavedSnapshot: snapshot,
          errorMessage: null,
        });
        scheduleSyncedFade(localId);

        if (isUnsavedInstallments || isUnsavedRecurring) {
          // Installments expand into multiple rows — reload so the generated
          // occurrences show up correctly.
          onAfterAdvancedModeSave?.();
        }

        if (pendingResave.current[localId]) {
          pendingResave.current[localId] = false;
          await persistRow(localId);
        }
      } catch (err) {
        patchRow(localId, {
          status: 'error',
          errorMessage: extractErrorMessage(err),
        });
      }
    },
    [
      householdId,
      frequency,
      monthConstraint,
      yearConstraint,
      patchRow,
      scheduleSyncedFade,
      onAfterAdvancedModeSave,
    ],
  );

  const handleRowPatch = useCallback(
    (localId: string, patch: Partial<DraftRow>) => {
      const current = rowsRef.current.find((r) => r.localId === localId);
      if (!current) return;
      const status =
        current.status === 'saving'
          ? 'saving'
          : current.status === 'idle' || current.status === 'synced'
            ? 'dirty'
            : current.status;
      patchRow(localId, {
        ...patch,
        status,
        errorMessage: status === 'error' ? current.errorMessage : null,
      });
    },
    [patchRow],
  );

  const handleRowRemove = useCallback(
    async (localId: string): Promise<void> => {
      const current = rowsRef.current.find((r) => r.localId === localId);
      if (!current) return;
      if (current.serverId === null) {
        removeRow(localId);
        return;
      }
      try {
        await deleteBudgetItem(current.serverId);
        removeRow(localId);
      } catch (err) {
        patchRow(localId, {
          status: 'error',
          errorMessage: `מחיקה נכשלה: ${extractErrorMessage(err)}`,
        });
      }
    },
    [patchRow, removeRow],
  );

  const handleAddRow = useCallback(() => {
    const localId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newRow: DraftRow = {
      localId,
      serverId: null,
      installmentsTotal: null,
      isRecurring: false,
      recurringFrequency: null,
      recurringEndDate: null,
      description: '',
      categoryId: null,
      amount: '',
      date: defaultDateFor(yearConstraint, monthConstraint),
      status: 'idle',
      errorMessage: null,
      lastSavedSnapshot: null,
      mode: 'none',
      endDate: null,
      isBiMonthly: false,
      needsReview: false,
      targetAmount: null,
      currency: CurrencyCode.ILS,
    };
    newRowFocus.current = localId;
    const next = [...rowsRef.current, newRow];
    rowsRef.current = next;
    onChange(next);
    onRowFocus?.(localId);
  }, [monthConstraint, yearConstraint, onChange, onRowFocus]);

  const errorCount = useMemo(
    () => rows.filter((r) => r.status === 'error').length,
    [rows],
  );

  const isEmpty = !isLoading && rows.length === 0;
  const noCategories = categories.length === 0;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {/* <span className="text-xl" aria-hidden>
            💰
          </span> */}
          <h2 className="heading-3">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {showTemplatesButton && onFillTemplates && (
            <motion.button
              type="button"
              onClick={onFillTemplates}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="הוסף שורות מתבנית"
              title="הוסף שורות מתבנית"
              className="w-10 h-10 bg-surface border border-slate-200 text-primary rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
            >
              <ListPlus size={18} strokeWidth={ICON_STROKE} />
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={handleAddRow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent text-white px-4 py-2 rounded-xl label-text shadow-sm hover:shadow-md hover:bg-accent/90 transition-all duration-200 flex items-center gap-1.5"
          >
            <Plus size={16} strokeWidth={ICON_STROKE} />
            הוסף שורה
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {errorCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
          >
            <AlertTriangle
              className="text-red-500"
              size={18}
              strokeWidth={ICON_STROKE}
            />
            <p className="body-text-sm text-red-600">
              יש {errorCount} שורות שלא נשמרו — לחץ על האייקון בכל שורה כדי
              לנסות שוב.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] md:gap-4 px-4 mb-2">
        <span className="label-text text-slate-400 text-xs">תיאור</span>
        <span className="label-text text-slate-400 text-xs">קטגוריה</span>
        <span className="label-text text-slate-400 text-xs">סכום (₪)</span>
        <span className="label-text text-slate-400 text-xs">תאריך</span>
        <span className="label-text text-slate-400 text-xs text-center">
          פעולה
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 flex-1">
        {noCategories && !isLoading && (
          <div className="py-10 text-center">
            <p className="body-text text-slate-500">
              אין קטגוריות זמינות. הוסף שורה ולחץ "+ הוסף קטגוריה חדשה"
              ברשימת הקטגוריות כדי ליצור קטגוריה ראשונה.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-slate-100 animate-pulse rounded-xl h-14"
              />
            ))}
          </div>
        )}

        {isEmpty && !noCategories && (
          <div className="py-10 text-center">
            <p className="body-text text-slate-500">
              אין הוצאות לתקופה הזו. לחץ "הוסף שורה" כדי להתחיל.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <BudgetItemRow
              key={row.localId}
              row={row}
              categories={categories}
              descriptionPlaceholder={descriptionPlaceholder}
              monthConstraint={monthConstraint}
              yearConstraint={yearConstraint}
              autoFocus={newRowFocus.current === row.localId}
              focused={focusedRowId === row.localId}
              onFocus={
                onRowFocus ? () => onRowFocus(row.localId) : undefined
              }
              onPatch={(patch) => {
                if (newRowFocus.current === row.localId) {
                  newRowFocus.current = null;
                }
                handleRowPatch(row.localId, patch);
              }}
              onBlurOutside={() => persistRow(row.localId)}
              onRemove={() => handleRowRemove(row.localId)}
              onRetry={() => persistRow(row.localId)}
              onAddCategoryRequest={
                onAddCategoryRequest
                  ? () => onAddCategoryRequest(row.localId)
                  : undefined
              }
              onAdvancedModeRequest={
                onAdvancedModeRequest
                  ? () => onAdvancedModeRequest(row.localId)
                  : undefined
              }
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
