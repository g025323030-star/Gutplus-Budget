import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement send reset email logic
    console.log('Reset email sent to:', email);
  };

  return (
    <motion.div
      className="bg-surface rounded-2xl shadow-md p-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="heading-2">אפוס סיסמה</h1>
        <p className="body-text">
          הכנס מייל לאיפוס סיסמה
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
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
              type="text"
              placeholder="you@example.com"
              defaultValue={email}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mt-6"
        >
          שלח מייל לאיפוס סיסמה
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>
      </form>

      {/* Back Button */}
      <motion.button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-primary hover:bg-background/50 py-2 rounded-xl transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowLeft size={18} strokeWidth={1.5} />
        <span className="text-sm font-medium">חזרה</span>
      </motion.button>
    </motion.div>
  );
}
