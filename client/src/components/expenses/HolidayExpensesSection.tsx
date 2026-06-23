import { PartyPopper } from 'lucide-react';
import { HOLIDAY_EXPENSE_TEMPLATES } from '@gutplus/shared';
import type { BudgetItem, Holiday } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import HolidayAccordion from './HolidayAccordion';

interface HolidayExpensesSectionProps {
  year: number;
  householdId: string;
  onTransactionsCreated: (transactions: BudgetItem[]) => void;
  totalsByHoliday: Partial<Record<Holiday, number>>;
}

export default function HolidayExpensesSection({
  year,
  householdId,
  onTransactionsCreated,
  totalsByHoliday,
}: HolidayExpensesSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <PartyPopper
          className="text-accent"
          size={22}
          strokeWidth={ICON_STROKE}
        />
        <div>
          <h2 className="heading-3">הוצאות חגים</h2>
          <p className="body-text-sm text-slate-500">
            סמן את ההוצאות הצפויות לכל חג והגדר סכום. כל פריט שתשמור ייווצר
            כעסקה בקטגוריה שבחרת.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {HOLIDAY_EXPENSE_TEMPLATES.map((template) => (
          <HolidayAccordion
            key={template.holiday}
            template={template}
            year={year}
            householdId={householdId}
            onTransactionsCreated={onTransactionsCreated}
            totalAmount={totalsByHoliday[template.holiday] ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
