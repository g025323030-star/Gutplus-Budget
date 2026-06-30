import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  /** localId of the row whose advanced-mode modal is currently open (if any). */
  advancedModeRowId?: string | null;
  onAfterAdvancedModeSave?: () => void;
  onFillTemplates?: () => void;
  showTemplatesButton?: boolean;
  title?: string;
  descriptionPlaceholder?: string;
  isYearly?: boolean;
  categoryMode?: 'combobox' | 'label';
  defaultCategoryId?: string | null;
  addRowDisabled?: boolean;
  sortable?: boolean;
  hideAddRow?: boolean;
  compact?: boolean;
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
  advancedModeRowId = null,
  onAfterAdvancedModeSave,
  onFillTemplates,
  showTemplatesButton = false,
  title = 'רשימת הוצאות',
  descriptionPlaceholder = 'לדוגמה: סופר',
  isYearly = false,
  categoryMode = 'combobox',
  defaultCategoryId = null,
  addRowDisabled = false,
  sortable = false,
  hideAddRow = false,
  compact = false,
}: BudgetItemTableProps) {
  type SortOption = 'default' | 'description-asc' | 'description-desc' | 'amount-desc' | 'amount-asc' | 'category';
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const rowsRef = useRef<DraftRow[]>(rows);
  const pendingResave = useRef<Record<string, boolean>>({});
  const newRowFocus = useRef<string | null>(null);
  const fadeTimers = useRef<Record<string, number>>({});
  const prevAdvancedRowId = useRef<string | null>(advancedModeRowId);

  // Keep rowsRef in sync FIRST so the advanced-mode persist effect below reads
  // the freshly-applied mode (installments/bi-monthly) rather than a stale row.
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

      if (
        !validateRow(
          current,
          yearConstraint,
          monthConstraint,
          isYearly,
        )
      ) {
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
        // A newly-created bi-monthly row (baseMonth set) must re-home into the
        // correct table by parity, so reload after it is created.
        const isUnsavedBiMonthly = !savedId && current.baseMonth !== null;

        const base = {
          amount: current.amount,
          description: current.description.trim(),
          frequency,
          householdId,
          categoryId: current.categoryId ?? undefined,
          needsReview: current.needsReview,
          targetAmount: current.targetAmount ?? undefined,
          currency: current.currency ?? CurrencyCode.ILS,
          assignedMonth: current.assignedMonth ?? undefined,
          isOneTime: current.isOneTime || undefined,
          baseMonth: current.baseMonth ?? undefined,
          // "Last billing month": a single projected item stops being billed
          // after this date. Materialized recurring (income) sets endDate via
          // the isUnsavedRecurring branch below instead.
          ...(current.mode === 'lastMonth' && current.endDate
            ? { endDate: current.endDate }
            : {}),
        };

        const payload = isUnsavedInstallments
          ? { ...base, installmentsTotal: current.installmentsTotal!, installmentIndex: 1 }
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

        if (isUnsavedInstallments || isUnsavedRecurring || isUnsavedBiMonthly) {
          // Installments expand into multiple rows, and bi-monthly rows must
          // re-home by parity — reload so everything shows up correctly.
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

  // When the advanced-mode modal closes (advancedModeRowId goes from a row's id
  // back to null), persist that row. The row's own blur was suppressed while the
  // modal was open, so this is what actually saves the chosen mode — including
  // creating the installment plan. Runs after the rowsRef sync effect, so the
  // row already carries its final mode.
  useEffect(() => {
    const closedRowId = prevAdvancedRowId.current;
    prevAdvancedRowId.current = advancedModeRowId;
    if (closedRowId && advancedModeRowId === null) {
      persistRow(closedRowId);
    }
  }, [advancedModeRowId, persistRow]);

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
        // For a collapsed installment group, delete ALL sibling rows on the server
        const idsToDelete =
          current.installmentSchedule && current.installmentSchedule.length > 0
            ? current.installmentSchedule.map((e) => e.serverId).filter(Boolean)
            : [current.serverId];
        await Promise.all(idsToDelete.map((id) => deleteBudgetItem(id)));
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
      categoryId: defaultCategoryId ?? null,
      amount: '',
      status: 'idle',
      errorMessage: null,
      lastSavedSnapshot: null,
      mode: 'none',
      endDate: null,
      isBiMonthly: false,
      needsReview: false,
      targetAmount: null,
      currency: CurrencyCode.ILS,
      assignedMonth: null,
      isOneTime: false,
      baseMonth: null,
    };
    newRowFocus.current = localId;
    const next = [...rowsRef.current, newRow];
    rowsRef.current = next;
    onChange(next);
    onRowFocus?.(localId);
  }, [monthConstraint, yearConstraint, defaultCategoryId, onChange, onRowFocus]);

  const errorCount = useMemo(
    () => rows.filter((r) => r.status === 'error').length,
    [rows],
  );

  const displayRows = useMemo(() => {
    if (sortOption === 'default') return rows;
    const copy = [...rows];
    if (sortOption === 'description-asc') {
      copy.sort((a, b) => a.description.localeCompare(b.description, 'he'));
    } else if (sortOption === 'description-desc') {
      copy.sort((a, b) => b.description.localeCompare(a.description, 'he'));
    } else if (sortOption === 'amount-desc') {
      copy.sort((a, b) => parseFloat(b.amount || '0') - parseFloat(a.amount || '0'));
    } else if (sortOption === 'amount-asc') {
      copy.sort((a, b) => parseFloat(a.amount || '0') - parseFloat(b.amount || '0'));
    } else if (sortOption === 'category') {
      copy.sort((a, b) => {
        const nameA = categories.find((c) => c.id === a.categoryId)?.name ?? '';
        const nameB = categories.find((c) => c.id === b.categoryId)?.name ?? '';
        return nameA.localeCompare(nameB, 'he');
      });
    }
    return copy;
  }, [rows, sortOption, categories]);

  const isEmpty = !isLoading && rows.length === 0;
  const noCategories = categories.length === 0;

  return (
    <div className={`bg-surface rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* <span className="text-xl" aria-hidden>
            💰
          </span> */}
          <h2 className="heading-3">{title}</h2>
          {sortable && (
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              aria-label="מיון שורות"
              className="text-xs bg-background/60 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-500 focus:outline-none focus:border-accent transition-all duration-200 cursor-pointer"
            >
              <option value="default">מיון: ברירת מחדל</option>
              <option value="description-asc">תיאור א→ת</option>
              <option value="description-desc">תיאור ת→א</option>
              <option value="amount-desc">סכום מהגבוה לנמוך</option>
              <option value="amount-asc">סכום מהנמוך לגבוה</option>
              <option value="category">לפי קטגוריה</option>
            </select>
          )}
        </div>
        {!hideAddRow && (
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
              onClick={addRowDisabled ? undefined : handleAddRow}
              disabled={addRowDisabled}
              whileHover={addRowDisabled ? undefined : { scale: 1.02 }}
              whileTap={addRowDisabled ? undefined : { scale: 0.98 }}
              className={`px-4 py-2 rounded-xl label-text shadow-sm transition-all duration-200 flex items-center gap-1.5 ${
                addRowDisabled
                  ? 'bg-accent/40 text-white/70 opacity-50 cursor-not-allowed'
                  : 'bg-accent text-white hover:shadow-md hover:bg-accent/90'
              }`}
            >
              <Plus size={16} strokeWidth={ICON_STROKE} />
              הוסף שורה
            </motion.button>
          </div>
        )}
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


      <div className={`space-y-3 overflow-y-auto pr-1 flex-1 ${compact ? 'max-h-[280px]' : 'max-h-[600px]'}`}>
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
          {displayRows.map((row) => (
            <BudgetItemRow
              key={row.localId}
              row={row}
              categories={categories}
              descriptionPlaceholder={descriptionPlaceholder}
              monthConstraint={monthConstraint}
              yearConstraint={yearConstraint}
              isYearly={isYearly}
              autoFocus={newRowFocus.current === row.localId || focusedRowId === row.localId}
              focused={focusedRowId === row.localId}
              categoryMode={categoryMode}
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
              advancedModeOpen={advancedModeRowId === row.localId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
