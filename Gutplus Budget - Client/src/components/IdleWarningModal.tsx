import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

const COUNTDOWN_SECONDS = 60;

interface IdleWarningModalProps {
  isVisible: boolean;
  onRenew: () => Promise<void>;
  onLogout: () => void;
}

export default function IdleWarningModal({ isVisible, onRenew, onLogout }: IdleWarningModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(COUNTDOWN_SECONDS);
      setIsRenewing(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleRenew = async () => {
    setIsRenewing(true);
    await onRenew();
    setIsRenewing(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-surface rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-4 text-center" dir="rtl">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="text-amber-600" size={32} strokeWidth={1.5} />
              </div>

              <h2 className="heading-2">הפגישה עומדת לפוג</h2>

              <p className="body-text">
                לא זוהתה פעילות. הפגישה תסתיים אוטומטית בעוד{' '}
                <span className="font-bold text-amber-600">{countdown}</span> שניות.
              </p>

              <div className="w-full space-y-3 mt-2">
                <button
                  onClick={handleRenew}
                  disabled={isRenewing}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <RefreshCw size={18} strokeWidth={1.5} className={isRenewing ? 'animate-spin' : ''} />
                  {isRenewing ? 'מחדש פגישה...' : 'חדש פגישה'}
                </button>

                <button
                  onClick={onLogout}
                  className="w-full border border-slate-200 text-primary hover:bg-background/50 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  יציאה
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
