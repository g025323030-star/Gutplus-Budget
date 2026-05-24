import type { RowStatus } from './SaveIndicator';

export interface DraftRowSnapshot {
  description: string;
  categoryId: string | null;
  amount: string;
  date: string;
}

export interface DraftRow extends DraftRowSnapshot {
  localId: string;
  serverId: string | null;
  installmentsTotal: number | null;
  status: RowStatus;
  errorMessage: string | null;
  lastSavedSnapshot: DraftRowSnapshot | null;
}

export const snapshotOf = (row: DraftRow): DraftRowSnapshot => ({
  description: row.description,
  categoryId: row.categoryId,
  amount: row.amount,
  date: row.date,
});

export const snapshotsEqual = (
  a: DraftRowSnapshot | null,
  b: DraftRowSnapshot,
): boolean =>
  a !== null &&
  a.description === b.description &&
  a.categoryId === b.categoryId &&
  a.amount === b.amount &&
  a.date === b.date;

export type { RowStatus };
