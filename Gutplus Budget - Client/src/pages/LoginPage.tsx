import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import LoginVisualSide from '../components/LoginVisualSide';
import LoginAuthForm from '../components/LoginAuthForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { getEmailErrorMessage } from '../utils/validation';
import { checkEmail } from '../services/user.service';

/**
 * LoginPage Component
 * Multi-step login form with visual side panel and authentication form.
 * Step 1: Email identification
 * Step 2a: Password for existing users
 * Step 2b: Registration for new users
 */

export default function LoginPage() {
    const [step, setStep] = useState<'email' | 'auth' | 'reset-password'>();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleEmailChange = (value: string) => {
        setEmail(value);
        // Clear error on change
        if (emailError) {
            setEmailError(null);
        }
    };

    const getResEmail = async () => {
        try {

            const resEmailChk = await checkEmail(email);
            console.log('Email check response:', resEmailChk);
            if (resEmailChk.message == 'unauthorized user.') {
                setEmailError('משתמש לא מזוהה במערכת, אנא פנה למשרדי גוטפלוס');
            } 
            if (resEmailChk.message == 'Account expired. Please contact support.') {
                setEmailError(' חשבון פג תוקף. אנא פנה למשרדי גוטפלוס');
            } 
            else if (resEmailChk.message == 'Welcome back! User found.') {
                console.log('Email check response:', resEmailChk);
                setStep('email');

            }
            else {
                setStep('auth');
                setIsNewUser(true);
            }
            return;
        } catch (error) {
            console.error("Error checking email:", error);
            throw error;
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const error = getEmailErrorMessage(email);
        if (error) {
            setEmailError(error);
            return;
        }
        getResEmail();
    }


    const handleBackToEmail = () => {
        setStep(undefined);
        // Keep email preserved, only clear error and reset state
        setEmailError(null);
        setIsNewUser(false);
    };

    const handleForgotPassword = () => {
        setStep('reset-password');
    };

    const handleBackFromReset = () => {
        setStep(undefined);
        setEmailError(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5, staggerChildren: 0.2 },
        },
    };

    // RTL animation variants
    const emailStepVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    };

    const authStepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
    };

    return (
        <motion.div
            className="min-h-screen bg-surface flex overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Auth Side */}
            <motion.div className="w-full lg:w-1/2 bg-surface flex items-center justify-center p-6 lg:p-0">
                <div className="w-full max-w-md">
                    <AnimatePresence mode="wait">
                        {!step ? (
                            <motion.div
                                key="email-step"
                                variants={emailStepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-surface rounded-2xl shadow-md p-8 space-y-6">
                                    <div className="space-y-2">
                                        <h1 className="heading-2">ברוכים הבאים</h1>
                                        <p className="body-text">הזן את כתובת האימייל שלך כדי להמשיך</p>
                                    </div>

                                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="label-text">
                                                כתובת אימייל
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 text-slate-400" strokeWidth={1.5} size={20} />
                                                <input
                                                    id="email"
                                                    type="text"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={(e) => handleEmailChange(e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-all ${emailError
                                                            ? 'border-red-400 focus:ring-red-400'
                                                            : 'border-slate-200 focus:ring-accent'
                                                        }`}
                                                    required
                                                />
                                            </div>
                                            {emailError && (
                                                <motion.div
                                                    className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-600 text-sm"
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <AlertCircle size={16} strokeWidth={1.5} className="flex-shrink-0" />
                                                    <span className="font-medium">{emailError}</span>
                                                </motion.div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!email}
                                            className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                                        >
                                            המשך
                                            <ArrowLeft size={18} strokeWidth={1.5} />
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        ) : step === 'auth' ? (
                            <motion.div
                                key="auth-step"
                                variants={authStepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <LoginAuthForm
                                    email={email}
                                    isNewUser={isNewUser}
                                    onBack={handleBackToEmail}
                                    onForgotPassword={handleForgotPassword}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                            </motion.div>
                        ) : step === 'reset-password' ? (
                            <motion.div
                                key="reset-step"
                                variants={authStepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <ForgotPasswordForm
                                    email={email}
                                    onBack={handleBackFromReset}
                                />
                            </motion.div>
                        ) : null
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Visual Side - Hidden on mobile */}
            <div className="hidden lg:flex w-1/2 bg-background">
                <LoginVisualSide />
            </div>
        </motion.div>
    );
}
