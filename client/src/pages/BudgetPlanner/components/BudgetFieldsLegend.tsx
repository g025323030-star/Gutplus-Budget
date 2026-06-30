import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { ICON_STROKE } from '../../../constants/ui';

const FIELD_EXPLANATIONS = [
  {
    label: 'תכנון ראשוני',
    text: 'היעד שנקבע מראש, או הממוצע ההיסטורי אם לא נקבע יעד — לקריאה בלבד.',
  },
  {
    label: 'תכנון חודשי',
    text: 'התחזית שניתן לעדכן עבור החודש הנבחר.',
  },
  {
    label: 'ביצוע בפועל',
    text: 'הסכום שבאמת יצא או נכנס בחודש זה.',
  },
];

/**
 * Persistent column-header row for a BudgetLineItemRow list (desktop-visible,
 * unlike BudgetLineItemRow's own md:hidden mobile-only labels), plus a small
 * collapsible accordion underneath explaining what each of the three fields
 * means. Rendered once per expanded AccordionRow, above its line items.
 */
export default function BudgetFieldsLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-1">
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.4fr] gap-3 items-center px-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition-colors duration-200 w-fit"
        >
          <Info size={14} strokeWidth={ICON_STROKE} />
          <span className="label-text">מה ההבדל בין השדות?</span>
          <ChevronDown
            size={14}
            strokeWidth={ICON_STROKE}
            className={`transition-transform duration-200 ${
              expanded ? '' : '-rotate-90'
            }`}
          />
        </button>
        <span className="label-text">תכנון ראשוני</span>
        <span className="label-text">תכנון חודשי</span>
        <span className="label-text">ביצוע בפועל</span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="md:hidden flex items-center gap-1.5 px-3 text-slate-400 hover:text-accent transition-colors duration-200"
      >
        <Info size={14} strokeWidth={ICON_STROKE} />
        <span className="label-text">מה ההבדל בין השדות?</span>
        <ChevronDown
          size={14}
          strokeWidth={ICON_STROKE}
          className={`transition-transform duration-200 ${
            expanded ? '' : '-rotate-90'
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 mt-1 space-y-1 bg-slate-50/60 rounded-lg">
              {FIELD_EXPLANATIONS.map((f) => (
                <p key={f.label} className="body-text-sm text-slate-500">
                  <span className="font-medium text-slate-600">{f.label}:</span>{' '}
                  {f.text}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
