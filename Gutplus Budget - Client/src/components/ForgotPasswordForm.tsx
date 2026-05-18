import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../services/user.service';

interface ForgotPasswordFormProps {
  email: string;
  onBack: () => void;
}

/**
 * ForgotPasswordForm Component
 * Reset password form with email input
 */
export default function ForgotPasswordForm({
  email,
  onBack,
}: ForgotPasswordFormProps) {
  const [formEmail, setFormEmail] = useState(email);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormEmail(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await forgotPassword(formEmail);
      setStatus('success');
      console.log('Reset email sent to:', formEmail);
    } catch (error) {
      setStatus('error');
      setErrorMessage('אירעה שגיאה בשליחת המייל. נסה שוב בבקשה.');
      console.error('Failed to send password reset email:', error);
    }
  };

  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <h2 className="heading-3">נשלח בהצלחה!</h2>
          </div>
          <p className="body-text">
            נשלח מייל לאיפוס סיסמה לכתובת <span className="font-semibold">{formEmail}</span>.
            אנא בדוק את תיבת הדואר הנכנס והספאם.
          </p>
        </div>
      );
    }

    return (
      <>
        <p className="body-text">
          הכנס מייל לאיפוס סיסמה
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="resetEmail" className="label-text">
              כתובת אימייל
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-slate-400"
                strokeWidth={1.5}
                size={20}
              />
              <input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                required
              />
            </div>
          </div>

          {status === 'error' && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mt-6"
          >
            {status === 'loading' ? 'שולח...' : 'שלח מייל לאיפוס סיסמה'}
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
        </form>
      </>
    );
  };

  return (
    <motion.div
      className="bg-surface rounded-2xl shadow-md p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <h1 className="heading-2">איפוס סיסמה</h1>
        {renderContent()}
      </div>

      <motion.button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-primary hover:bg-background/50 py-2 rounded-xl transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowRight size={18} strokeWidth={1.5} />
        <span className="text-sm font-medium">חזרה</span>
      </motion.button>
    </motion.div>
  );
}
