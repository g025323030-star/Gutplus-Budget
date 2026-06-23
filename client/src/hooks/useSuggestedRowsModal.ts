import { useCallback, useState } from 'react';
import { CategoryFrequency } from '@gutplus/shared';
import type { CreateBudgetItemInput } from '@gutplus/shared';
import { createBudgetItem, updateBudgetItem } from '../services/budget-items.service';
import type { DraftRow } from '../components/budget-items/types';

export interface UseSuggestedRowsModalParams {
  householdId: string | null | undefined;
  validRowFilter: (row: DraftRow) => boolean;
  buildPayloadExtras: (row: DraftRow) => Partial<CreateBudgetItemInput>;
  onSaved: () => void;
  frequency?: CategoryFrequency;
}

export interface UseSuggestedRowsModalResult {
  isOpen: boolean;
  rows: DraftRow[];
  isSaving: boolean;
  open: (rows: DraftRow[]) => void;
  save: (rowsFromModal: DraftRow[]) => Promise<void>;
  close: () => void;
}

export function useSuggestedRowsModal(
  params: UseSuggestedRowsModalParams,
): UseSuggestedRowsModalResult {
  const { householdId, validRowFilter, buildPayloadExtras, onSaved, frequency } = params;

  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const open = useCallback((newRows: DraftRow[]) => {
    setRows(newRows);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setRows([]);
  }, []);

  const save = useCallback(async (rowsFromModal: DraftRow[]) => {
    const validRows = rowsFromModal.filter(validRowFilter);

    if (validRows.length === 0) {
      setIsOpen(false);
      setRows([]);
      return;
    }

    if (!householdId) return;

    setIsSaving(true);

    try {
      for (const row of validRows) {
        const payload: CreateBudgetItemInput = {
          amount: String(row.amount),
          description: row.description.trim(),
          frequency: frequency ?? CategoryFrequency.MONTHLY,
          householdId,
          categoryId: row.categoryId ?? undefined,
          installmentsTotal: row.installmentsTotal ?? undefined,
          assignedMonth: row.assignedMonth ?? undefined,
          isOneTime: row.isOneTime || undefined,
          needsReview: row.needsReview,
          ...buildPayloadExtras(row),
        };

        if (row.serverId) {
          await updateBudgetItem(row.serverId, payload);
        } else {
          await createBudgetItem(payload);
        }
      }

      onSaved();
      setIsOpen(false);
      setRows([]);
    } catch (err) {
      console.error('Failed to save suggested rows:', err);
      alert('התרחשה שגיאה בעת שמירת הנתונים');
    } finally {
      setIsSaving(false);
    }
  }, [householdId, validRowFilter, buildPayloadExtras, onSaved, frequency]);

  return { isOpen, rows, isSaving, open, save, close };
}
