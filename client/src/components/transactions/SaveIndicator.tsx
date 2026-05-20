import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ICON_STROKE } from '../../constants/ui';

export type RowStatus = 'idle' | 'dirty' | 'saving' | 'synced' | 'error';

interface SaveIndicatorProps {
  status: RowStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function SaveIndicator({
  status,
  errorMessage,
  onRetry,
}: SaveIndicatorProps) {
  return (
    <div
      className="w-9 h-9 flex items-center justify-center"
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-2 h-2 rounded-full bg-slate-300"
            aria-label="ללא שינוי"
          />
        )}

        {status === 'dirty' && (
          <motion.span
            key="dirty"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="block w-3 h-3 rounded-full border-2 border-accent"
            aria-label="לא נשמר"
          />
        )}

        {status === 'saving' && (
          <motion.span
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-accent"
            aria-label="שומר..."
          >
            <Loader2
              className="animate-spin"
              size={18}
              strokeWidth={ICON_STROKE}
            />
          </motion.span>
        )}

        {status === 'synced' && (
          <motion.span
            key="synced"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="text-green-500"
            aria-label="נשמר"
          >
            <CheckCircle2 size={20} strokeWidth={ICON_STROKE} />
          </motion.span>
        )}

        {status === 'error' && (
          <motion.button
            key="error"
            type="button"
            onClick={onRetry}
            title={errorMessage ?? 'שגיאה בשמירה. לחץ לנסות שוב.'}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="text-red-500 cursor-pointer p-1 rounded-lg hover:bg-red-50"
            aria-label="שגיאה — נסה שוב"
          >
            <AlertCircle size={20} strokeWidth={ICON_STROKE} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
