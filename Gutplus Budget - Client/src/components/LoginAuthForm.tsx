import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Eye, EyeOff, ArrowRight, User } from 'lucide-react';

interface LoginAuthFormProps {
  email: string;
  isNewUser: boolean;
  onBack: () => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

/**
 * LoginAuthForm Component
 * Step 2 of the login process
 * Shows either password login for existing users or registration fields for new users
 */
export default function LoginAuthForm({
  email,
  isNewUser,
  onBack,
  showPassword,
  setShowPassword,
}: LoginAuthFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual login/registration logic
    console.log('Form submitted');
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
        <h1 className="heading-2">
          {isNewUser ? 'יצירת חשבון' : 'כניסה'}
        </h1>
        <p className="body-text text-sm">{email}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New User: Full Name Field */}
        {isNewUser && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label htmlFor="fullName" className="label-text">
              שם מלא
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-3 text-slate-400"
                strokeWidth={1.5}
                size={20}
              />
              <input
                id="fullName"
                type="text"
                placeholder="ישראל ישראלי"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                required
              />
            </div>
          </motion.div>
        )}

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="label-text">
            {isNewUser ? 'הגדר סיסמה' : 'סיסמה'}
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-3 text-slate-400"
              strokeWidth={1.5}
              size={20}
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={
                isNewUser
                  ? 'הזן סיסמה חזקה'
                  : 'הזן את הסיסמה שלך'
              }
              className="w-full pl-10 pr-12 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={1.5} />
              ) : (
                <Eye size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Existing User: Forgot Password Link */}
        {!isNewUser && (
          <motion.div
            className="flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <a
              href="#forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              שכחת סיסמה?
            </a>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mt-6"
        >
          {isNewUser ? 'צור חשבון' : 'התחבר'}
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

      {/* Footer Text */}
      <motion.div
        className="text-center text-xs text-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isNewUser ? (
          <p>
            כבר יש לך חשבון?{' '}
            <a href="#" className="text-accent font-medium hover:underline">
              כנס כאן
            </a>
          </p>
        ) : (
          <p>
            עדיין אין לך חשבון?{' '}
            <a href="#" className="text-accent font-medium hover:underline">
              צור אחד
            </a>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
