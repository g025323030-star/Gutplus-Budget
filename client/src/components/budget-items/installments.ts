import type { DraftRow, InstallmentScheduleEntry } from './types';

/** Add `n` months to a Date, handling year roll-over correctly. */
function addMonths(base: Date, n: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + n, 1);
  return d;
}

/**
 * Collapse all installment sibling rows of each group into a single
 * representative row that carries the full schedule for expansion.
 *
 * Rows without an `installmentGroupId` pass through unchanged.
 * Groups whose payment doesn't land in `viewMonth`/`viewYear` are dropped.
 */
export function groupInstallmentRows(
  rows: DraftRow[],
  viewMonth: number,
  viewYear: number,
): DraftRow[] {
  // Separate plain rows from installment siblings
  const plain: DraftRow[] = [];
  const groups = new Map<string, DraftRow[]>();

  for (const row of rows) {
    if (!row.installmentGroupId) {
      plain.push(row);
    } else {
      const existing = groups.get(row.installmentGroupId) ?? [];
      existing.push(row);
      groups.set(row.installmentGroupId, existing);
    }
  }

  if (groups.size === 0) return rows;

  // Build a position map so we can slot representatives back in order
  // (use the first-seen index of any sibling)
  const positionOf = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const gid = rows[i].installmentGroupId;
    if (gid && !positionOf.has(gid)) {
      positionOf.set(gid, i);
    }
  }

  // Build representative rows for groups that have a current payment
  const representatives = new Map<string, DraftRow>();
  for (const [gid, members] of groups) {
    // Sort by installmentIndex ascending
    const sorted = [...members].sort(
      (a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0),
    );

    // Find which member lands in the viewed month
    const current = sorted.find((m) => m.assignedMonth === viewMonth);
    if (!current) {
      // No payment this month — drop the group entirely
      continue;
    }

    const currentIndex = current.installmentIndex ?? 1;
    const viewBase = new Date(viewYear, viewMonth - 1, 1);

    const schedule: InstallmentScheduleEntry[] = sorted.map((m) => {
      const offset = (m.installmentIndex ?? 1) - currentIndex;
      const date = addMonths(viewBase, offset);
      return {
        serverId: m.serverId ?? '',
        index: m.installmentIndex ?? 1,
        total: m.installmentsTotal ?? sorted.length,
        amount: m.amount,
        currency: m.currency,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isCurrent: m.installmentIndex === currentIndex,
      };
    });

    const rep: DraftRow = {
      ...current,
      installmentSchedule: schedule,
    };
    representatives.set(gid, rep);
  }

  if (representatives.size === 0) {
    // No installment reps survived — return only plain rows
    return plain;
  }

  // Reconstruct the array in original order, inserting each representative
  // at the position the first sibling occupied.
  const result: DraftRow[] = [];
  const usedPositions = new Set<string>(); // group ids already inserted

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const gid = row.installmentGroupId;

    if (!gid) {
      result.push(row);
      continue;
    }

    if (usedPositions.has(gid)) {
      // Subsequent siblings are collapsed — skip
      continue;
    }

    usedPositions.add(gid);
    const rep = representatives.get(gid);
    if (rep) {
      result.push(rep);
    }
    // If no rep (group dropped), don't push anything
  }

  return result;
}
