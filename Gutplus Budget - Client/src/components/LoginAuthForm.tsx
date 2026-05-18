import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { validatePasswordMatch, validatePasswordStrength } from '../utils/validation';
import { signUp, login, resetPassword } from '../services/user.service';

interface LoginAuthFormProps {
  email: string;
  isNewUser: boolean;
  onBack: () => void;
  onForgotPassword?: () => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  isResetPassword?: boolean;
  resetToken?: string;
  onSuccess?: () => void;
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
  onForgotPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isResetPassword = false,
  resetToken = '',
  onSuccess,
}: LoginAuthFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Validate password strength for new users
    if (isNewUser && value) {
      const error = validatePasswordStrength(value);
      setPasswordError(error);
    } else {
      setPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Validate on change for new users
    if (isNewUser && value && password) {
      // First validate password strength
      const strengthError = validatePasswordStrength(password);
      if (strengthError) {
        setPasswordError(strengthError);
      } else {
        // Then check if passwords match
        const matchError = validatePasswordMatch(password, value);
        setPasswordError(matchError);
      }
    } else if (isNewUser && password) {
      // If confirm password is empty, show password strength error if exists
      const strengthError = validatePasswordStrength(password);
      setPasswordError(strengthError);
    }
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords for new users and reset password
    if (isNewUser || isResetPassword) {
      // Check password strength first
      const strengthError = validatePasswordStrength(password);
      if (strengthError) {
        setPasswordError(strengthError);
        return;
      }

      // Then check if passwords match
      const matchError = validatePasswordMatch(password, confirmPassword);
      if (matchError) {
        setPasswordError(matchError);
        return;
      }
    }

    try {
      if (isResetPassword && resetToken) {
        await resetPassword(resetToken, password);
        setSuccessMessage('הסיסמה אופסה בהצלחה! ניתן כעת להתחבר עם הסיסמה החדשה.');
        setPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      } else if (isNewUser) {
        await signUp(email, password);
        onSuccess?.();
      } else {
        await login(email, password);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error:', error);
      setPasswordError('אירעה שגיאה. אנא נסה שוב.');
    }
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
          {isResetPassword ? 'איפוס סיסמה' : isNewUser ? 'יצירת חשבון' : 'כניסה'}
        </h1>
        <p className="body-text text-sm">{email}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-green-600 text-sm">
            <span className="font-medium">{successMessage}</span>
          </div>

          {/* Back to Login Button */}
          <button
            type="button"
            onClick={() => {
              setSuccessMessage(null);
              onBack();
            }}
            className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
          >
            חזרה להתחברות
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}

      {/* Form - Only show if no success message */}
      {!successMessage && (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="label-text">
            {isResetPassword ? 'סיסמה חדשה' : isNewUser ? 'הגדר סיסמה' : 'סיסמה'}
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
                isResetPassword
                  ? 'הזן סיסמה חדשה'
                  : isNewUser
                  ? 'הזן סיסמה חזקה'
                  : 'הזן את הסיסמה שלך'
              }
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`w-full pl-10 pr-12 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                (isNewUser || isResetPassword) && password && passwordError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-slate-200 focus:ring-accent'
              }`}
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
          {(isNewUser || isResetPassword) && password && passwordError && (
            <motion.div
              className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-600 text-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle size={16} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="font-medium">{passwordError}</span>
            </motion.div>
          )}
        </div>

        {/* Confirm Password Field - Only for New Users and Reset Password */}
        {(isNewUser || isResetPassword) && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label htmlFor="confirmPassword" className="label-text">
              אימות סיסמה
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-400"
                strokeWidth={1.5}
                size={20}
              />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="הקש סיסמה שנית"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full pl-10 pr-12 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  passwordError
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-slate-200 focus:ring-accent'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} strokeWidth={1.5} />
                ) : (
                  <Eye size={20} strokeWidth={1.5} />
                )}
              </button>
            </div>
            {passwordError && (
              <motion.div
                className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-600 text-sm"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle size={16} strokeWidth={1.5} className="flex-shrink-0" />
                <span className="font-medium">{passwordError}</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Existing User: Forgot Password Link */}
        {!isNewUser && (
          <motion.div
            className="flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-accent font-medium hover:underline transition-colors"
            >
              שכחת סיסמא?
            </button>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 mt-6"
        >
          {isResetPassword ? 'איפוס סיסמה' : isNewUser ? 'צור חשבון' : 'התחבר'}
          <ArrowLeft size={18} strokeWidth={1.5} />
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
        <ArrowRight size={18} strokeWidth={1.5} />
        <span className="text-sm font-medium">חזרה</span>
      </motion.button>
        </>
      )}
    </motion.div>
  );
}
