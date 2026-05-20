import { PartyPopper } from 'lucide-react';
import { HOLIDAY_EXPENSE_TEMPLATES } from '@gutplus/shared';
import type { Category, Transaction } from '@gutplus/shared';
import { ICON_STROKE } from '../../constants/ui';
import HolidayAccordion from './HolidayAccordion';

interface HolidayExpensesSectionProps {
  year: number;
  categories: Category[];
  householdId: string;
  onTransactionsCreated: (transactions: Transaction[]) => void;
}

export default function HolidayExpensesSection({
  year,
  categories,
  householdId,
  onTransactionsCreated,
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
            categories={categories}
            householdId={householdId}
            onTransactionsCreated={onTransactionsCreated}
          />
        ))}
      </div>
    </section>
  );
}
